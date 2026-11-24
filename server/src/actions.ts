// Actions for 小孩数学空间: a kid-facing library of math knowledge cards
// filed under bright categories. Cards and categories are user-owned data
// in ctx.db; card images live in ctx.blobs (only the key is stored).

import { defineAction, z, type ActionsModule } from "@hatch/space-sdk";
import { asc, desc, eq } from "drizzle-orm";
import { privileged } from "@space/privileged";
import * as schema from "./schema";

// ---------- shared shapes ----------

const categoryShape = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  card_count: z.number(),
});

const cardShape = z.object({
  id: z.number(),
  title: z.string(),
  points: z.string(),
  category_id: z.number(),
  image_url: z.string().nullable(),
  created_at: z.string(),
});

const libraryResponse = z.object({
  categories: z.array(categoryShape),
  cards: z.array(cardShape),
});

const categoryResponse = z.object({ category: categoryShape });
const cardResponse = z.object({ card: cardShape });
const doneResponse = z.object({ ok: z.literal(true) });
const seedResponse = z.object({
  seeded: z.boolean(),
  seeded_cards: z.number(),
});

const imageInput = z.object({
  dataBase64: z.string().min(1).max(16_000_000),
  mimeType: z.string().min(1).max(100),
});

const IMAGE_MIMES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

// Palette keys, cycled for categories the user adds later.
const PALETTE = [
  "coral",
  "blue",
  "purple",
  "green",
  "teal",
  "pink",
  "orange",
  "amber",
] as const;

const PRESET_CATEGORIES: ReadonlyArray<{
  name: string;
  color: string;
  sortOrder: number;
}> = [
  { name: "乘法公式", color: "coral", sortOrder: 0 },
  { name: "因式分解", color: "blue", sortOrder: 1 },
  { name: "方程", color: "purple", sortOrder: 2 },
  { name: "数与计算", color: "green", sortOrder: 3 },
  { name: "几何", color: "teal", sortOrder: 4 },
  { name: "应用题", color: "pink", sortOrder: 5 },
];

// The four starter cards the user sent with the build request — titles,
// categories, and 要点 are the user's own words, verbatim.
const SEED_CARDS: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "brackets",
    title: "搞定带符号的括号：两种方法大对决",
    categoryName: "方程",
    points:
      "方法1 魔法分身——把括号前的符号和数字看成不可分割的整体，一起乘进去，异号得负、负负得正，一步到位；方法2 先算内部、再处理符号——括号前是负号时，去括号每一项都要变号，别漏。例：5 − 2(3x − 4) = 21 → 5 − 6x + 8 = 21。",
  },
  {
    slot: "cross",
    title: "因式分解：十字相乘法",
    categoryName: "因式分解",
    points:
      "x² + bx + c 想拆成 (x + m)(x + n)，就找两个数 m、n，让 m + n = b、m × n = c；交叉相乘再相加，正好等于一次项系数就对了。例：x² + 5x + 6 = (x + 2)(x + 3)；2x² − 7x + 3 = (2x − 1)(x − 3)。",
  },
  {
    slot: "diffSquare",
    title: "差的平方：用面积看懂 (a − b)²",
    categoryName: "乘法公式",
    points:
      "(a − b)² = a² − 2ab + b²。用面积想：大正方形 a² 减去两条长条 ab，小角 b² 被减了两次，要加回一次。试一试：(5 − 2)² = 25 − 20 + 4 = 9。",
  },
  {
    slot: "sumSquare",
    title: "和的平方：(a + b)² 的面积图",
    categoryName: "乘法公式",
    points:
      "(a + b)² = a² + 2ab + b²。用面积想：边长 a + b 的大正方形，被分成 a²、两个 ab 长条和 b²，正好拼满。记住中间项是 2ab，别漏。",
  },
];

// The 13 cards added on 2026-11-25 (two batches the user sent the same
// evening, processed once): 4 finished teaching images used as-is, 9
// redrawn clean diagrams. Titles, categories, and 要点 are the user's
// own words, verbatim.
const SEED_CARDS_V3: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "sameSideInterior",
    title: "什么是同旁内角",
    categoryName: "几何",
    points:
      "两条直线被第三条直线（截线）所截，在两条直线的内部、截线同一侧的两个角，叫同旁内角，位置像字母 U。如果两直线平行，同旁内角互补：∠1 + ∠2 = 180°。",
  },
  {
    slot: "parallelogramAngles",
    title: "平行四边形的同旁内角互补",
    categoryName: "几何",
    points:
      "平行四边形里相邻的两个角就是同旁内角（由一组平行线加一条边作截线形成），所以互补：∠A + ∠B = 180°、∠C + ∠D = 180°。知道一个角，就能推出其余三个角。",
  },
  {
    slot: "squareSpeed",
    title: "完全平方公式速算：接近整百、整千的数",
    categoryName: "乘法公式",
    points:
      "看到 102、998 这种接近整百、整千的数，先拆成（整百 ± 小数），再套完全平方公式：102² = (100+2)² = 10000 + 400 + 4 = 10404；998² = (1000−2)² = 1000000 − 4000 + 4 = 996004；顺带记住 101² = 10201、999² = (1000−1)² = 998001。展开三项别漏中间项 2ab。",
  },
  {
    slot: "bracketFirst",
    title: "去括号：−2(x−2) 先变成 −(2x−4)",
    categoryName: "方程",
    points:
      "算 2x − 2(x−2)，先把括号前的 −2 乘进去，变成 2x − (2x−4)；再去括号、逐项变号：= 2x − 2x + 4 = 4。易错点：括号前是负号，去括号时里面每一项都要变号，−4 要变 +4。",
  },
  {
    slot: "congruenceFive",
    title: "全等三角形判定五法",
    categoryName: "几何",
    points:
      "SSS：三边对应相等；SAS：两边及其夹角对应相等；ASA：两角及其夹边对应相等；AAS：两角和其中一角的对边对应相等；HL：只用于直角三角形，斜边和一条直角边对应相等。注意：SSA（两边和其中一边的对角）不能判定全等，别上当。",
  },
  {
    slot: "segmentAdd",
    title: "线段加减：由 AE + CD = AD 推出 AC = AE",
    categoryName: "几何",
    points:
      "两条线段都加上同一段 CD，结果都等于同一条 AD，那么这两条线段就相等：AE + CD = AD、AC + CD = AD，所以 AC = AE。找全等缺的那条边时，先看看图上有没有这种「等量加等量」的关系。例：再配上 DE = BC、AD = AB，就能用 SSS 判定 △EAD ≌ △CAB。",
  },
  {
    slot: "overlapSplit",
    title: "叠在一起的三角形：分开画，对应看",
    categoryName: "几何",
    points:
      "两个三角形叠放或交叉时，先把它们分开各画一个，标出已知相等的边和角，对应关系立刻就清楚了。例：图中 ad = de、∠1 = ∠2，分开看就知道哪条边对哪条边、哪个角对哪个角。",
  },
  {
    slot: "kiteCommon",
    title: "公共边：风筝形里的对角线",
    categoryName: "几何",
    points:
      "风筝形 ABCD 里 AB = AD、CB = CD，对角线 AC 是两个三角形的公共边——公共边不用题目给，它自己就在图里。凑齐三边，△ABC ≌ △ADC（SSS）。做全等题先找隐藏条件：公共边、公共角、对顶角。",
  },
  {
    slot: "correspondenceOrder",
    title: "全等对应关系：看字母顺序，不看位置",
    categoryName: "几何",
    points:
      "△ABC ≌ △EFD，字母按顺序一一对应：A↔E、B↔F、C↔D，所以 AB = EF、BC = FD、AC = ED，∠A = ∠E、∠B = ∠F、∠C = ∠D。易错点：不能看图形位置猜对应，B 和 D 位置像也不是对应点。口诀：全等看顺序，字母来配对；前前对应前，后后对应后。",
  },
  {
    slot: "bracketRule",
    title: "去括号规则：负号入内，每项变号",
    categoryName: "方程",
    points:
      "括号前是减号，去括号后每一项都要变号：−(a + b) = −a − b；−(a − b) = −a + b；5 − (2x + 3) = 5 − 2x − 3；5 − 2(3x − 4) = 5 − 6x + 8。口诀：负号入内，正变负、负变正。",
  },
  {
    slot: "commonAngle",
    title: "想证线段相等：先证两个三角形全等",
    categoryName: "几何",
    points:
      "要证两条线段相等（比如 AD = AE），先看它们分别在哪个三角形里，把这两个三角形证全等，对应边自然相等。例：AB = AC、∠B = ∠C，再加上公共角 ∠A，用 ASA 证 △ACD ≌ △ABE，就得到 AD = AE。常配套的还有 AAS：两个角和其中一角的对边对应相等，也能判定全等。",
  },
  {
    slot: "combineTerms",
    title: "解方程基本功：合并同类项",
    categoryName: "方程",
    points:
      "先把左边的 x 项合并、常数归堆，再移项，最后把系数化为 1。例1：3x − 4x + 8 = 5 → −x = −3 → x = 3。例2：4x − 6x + 2 = 14 → −2x = 12 → x = −6。注意：−x = −3 时两边同除以 −1，得 x = 3，别把符号弄丢。",
  },
  {
    slot: "bracketEquation",
    title: "带括号的方程：完整例题",
    categoryName: "方程",
    points:
      "解题顺序：去括号 → 合并同类项 → 移项 → 系数化为 1。例1：2x − 4(2x − 3) = 18 → 2x − 8x + 12 = 18 → −6x = 6 → x = −1。例2：3x − 4(x − 2) = 5 → 3x − 4x + 8 = 5 → −x = −3 → x = 3。去括号最易错：−4 × (−3) = +12、−4 × (−2) = +8。",
  },
];

// The 6 cards of the third batch (sent later the same evening):
// 3 finished teaching images used as-is, 3 redrawn clean diagrams.
// Titles, categories, and 要点 are the user's own words, verbatim.
const SEED_CARDS_V4: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "parallelogramAltAngles",
    title: "平行四边形内错角相等",
    categoryName: "几何",
    points:
      "平行四边形的对边平行，对角线就是截线：以 AC 为截线，∠1 = ∠2（AB ∥ CD 的内错角）；以 BD 为截线，∠3 = ∠4（AD ∥ BC 的内错角）。内错角在截线的两侧、两条直线的内部，形状像字母 Z。口诀：平行四边两组对，内错角，相等配。",
  },
  {
    slot: "parallelCriterion",
    title: "平行线判定：内错角相等，两直线平行",
    categoryName: "几何",
    points:
      "这张和上一张正好反着用：性质是「平行 → 内错角相等」，判定是「内错角相等 → 平行」。直线 a、b 被截线 c 所截，如果有一组内错角相等，就能判定 a ∥ b。",
  },
  {
    slot: "minusToPlus",
    title: "减正数 = 加负数：数轴魔法",
    categoryName: "数与计算",
    points:
      "减去一个正数，等于加上它的相反数：5 − 2 = 5 + (−2) = 3。数轴上想：减正数是面朝正方向往后退 2 步；加负数是转身往回走 2 步——到的位置一模一样。生活里也一样：花钱 2 元 = 欠债增加 2 元。",
  },
  {
    slot: "diffSquares",
    title: "平方差公式：a² − b² = (a + b)(a − b)",
    categoryName: "乘法公式",
    points:
      "两个数的平方差，等于它们的和乘以它们的差：a² − b² = (a + b)(a − b)。面积上看：大正方形挖掉小正方形，剩下的图形正好拼成那个长方形。速算例：102² − 98² = (102 + 98) × (102 − 98) = 200 × 4 = 800。",
  },
  {
    slot: "inequalityRight",
    title: "解一元一次不等式：把 x 挪到右边",
    categoryName: "方程",
    points:
      "解不等式的步骤和解方程一样：移项、合并、系数化为 1。小窍门：x 的系数是负数时，把 x 项移到右边、让系数保持正数，就不用操心变号。例：10 − 4x < 2 → 10 − 2 < 4x → x > 2；15 − 3x > 3 → 15 − 3 > 3x → x < 4；12 + 4x < 28 → x < 4。最后提醒：如果真的两边除以负数，不等号必须反过来。",
  },
  {
    slot: "cowGrass",
    title: "牛吃草问题：草在长，牛在吃",
    categoryName: "应用题",
    points:
      "模型：原有草量 + 生长速度 × 周数 = 牛头数 × 周数（每头牛每周吃 1 份）。例：草可供 27 头牛吃 6 周，或 23 头牛吃 9 周。设原有草量 x、每周长草 y：x + 6y = 27 × 6，x + 9y = 23 × 9，解得 x = 72、y = 15。问 21 头牛吃几周：72 + 15t = 21 × t，解得 t = 12 周。关键：草不是死的，它一边被吃、一边在长。",
  },
];

// The 5 cards of the fourth batch (sent 2026-11-25): 2 finished teaching
// images used as-is, 3 redrawn clean diagrams. Titles, categories, and
// 要点 are the user's own words, verbatim.
const SEED_CARDS_V5: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "moneySave",
    title: "存钱大作战：列不等式",
    categoryName: "应用题",
    points:
      "小明原有 10 元，每天存 5 元，存 x 天后钱要超过 25 元：原有 10 元 + 每天存 5 元 × 天数 > 25 元，列成不等式 10 + 5x > 25。解：5x > 15，x > 3，所以至少存 4 天，钱才超过 25 元。列不等式和列方程一样，先找「超过、至少、不足」这类关键词来定不等号的方向。",
  },
  {
    slot: "commonFactor",
    title: "提公因式法：先找公因式",
    categoryName: "因式分解",
    points:
      "5y² − 10y 两项里都有 5y，把它提出来：5y² − 10y = 5y(y − 2)，选 A。提公因式三步：① 找各项系数的最大公约数；② 找各项都有的相同字母；③ 字母取最低次幂。验算：5y(y − 2) 展开正好等于 5y² − 10y。",
  },
  {
    slot: "signRules",
    title: "符号乘法口诀：同号得正，异号得负",
    categoryName: "方程",
    points:
      "乘法符号口诀：同号得正（+·+ = +，−·− = +），异号得负（+·− = −，−·+ = −）。去括号就是在做符号乘法：5 − 2(3x − 4) = 21，先算 (−2)·(3x) = −6x（异号得负）、(−2)·(−4) = +8（负负得正），得 5 − 6x + 8 = 21。强化练习：x − 3(2x − 4) = 7 → x − 6x + 12 = 7 → x = 1。",
  },
  {
    slot: "splitEquation",
    title: "一类方程：ax + b(c − x) = d",
    categoryName: "方程",
    points:
      "这种方程先去括号：把 (c − x) × b 展开成 bc − bx，再合并同类项。例1：2x + (4 − x) × 4 = 10 → 2x + 16 − 4x = 10 → −2x = −6 → x = 3。例2：2x + (3 − x) × 5 = 9 → 2x + 15 − 5x = 9 → −3x = −6 → x = 2。应用题里把总数拆成两部分时（比如鸡兔同笼），经常列出这种式子。",
  },
  {
    slot: "inequalityMove",
    title: "不等式移项，符号不变",
    categoryName: "方程",
    points:
      "解不等式移项的时候，不等号的方向不用变，照着解方程做就行。例1：10 + 5x > 25 → 5x > 25 − 10 → 5x > 15 → x > 3，全程都是 >。例2：15 − 3x > 3 → 15 − 3 > 3x → 4 > x，也就是 x < 4。只有一种情况要变号：两边同时乘以或除以负数时，不等号才反过来。",
  },
];

// The 3 math cards of the fifth batch (sent 2026-11-25; the same send
// also carried 7 programming images, deliberately not carded pending
// the user's decision). All three diagrams are redrawn clean; the
// chicken-rabbit card uses the 假设法 from the brief, not the source
// draft's matrix method (whose final answer didn't check out). Titles,
// categories, and 要点 are the user's own words, verbatim.
const SEED_CARDS_V6: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "arithmeticSeq",
    title: "等差数列：通项公式与求和",
    categoryName: "数与计算",
    points:
      "相邻两项的差固定（这个差叫公差 d）的数列，叫等差数列。第 n 项 = 第一项 + (n − 1) × 公差。例：2, 4, 6, 8, 10… 公差是 2，第 n 项 = 2 + (n − 1) × 2 = 2n，所以第 100 项是 200。求和公式：S = 项数 ×（第一项 + 最后一项）÷ 2。前 5 项和 = 5 × (2 + 10) ÷ 2 = 30；前 100 项和 = 100 × (2 + 200) ÷ 2 = 10100。",
  },
  {
    slot: "treePlanting",
    title: "植树问题：间隔数 = 棵数 − 1",
    categoryName: "应用题",
    points:
      "两端都栽树时，间隔数比棵数少 1：3 棵树只有 2 个间隔。例：第一棵种在 1 米处、每隔 2 米种一棵，第 x 棵的位置 = 1 + (x − 1) × 2 = 2x − 1（米）：第 2 棵在 3 米，第 3 棵在 5 米。这也是等差数列通项公式里为什么是 (n − 1) 的来历：从第一项出发，只走了 n − 1 个间隔。",
  },
  {
    slot: "chickenRabbit",
    title: "鸡兔同笼：假设法",
    categoryName: "应用题",
    points:
      "鸡兔同笼共 48 只、100 只脚。假设全是鸡：脚只有 48 × 2 = 96 只，还少 100 − 96 = 4 只脚；每把一只鸡换成一只兔，脚就多 2 只，所以兔 = 4 ÷ 2 = 2 只，鸡 = 48 − 2 = 46 只。验算：46 × 2 + 2 × 4 = 92 + 8 = 100 ✓。口诀：假设全是鸡，差的脚数除以 2，就是兔的只数。",
  },
];

// The 11 cards of the v7 batch (2026-11-25): the 6 programming cards
// left over from the fifth send — the user decided to file them in this
// space under a new 编程 category — plus the 4 cards of the sixth send
// and 1 card from the seventh send. 5 finished images used as-is, 6
// redrawn clean diagrams. Titles, categories, and 要点 are the user's
// own words, verbatim.
const SEED_CARDS_V7: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "encapsulation",
    title: "封装：把秘密藏进盒子里",
    categoryName: "编程",
    points:
      "封装就是把内部细节藏起来，只留出对外用的开关。内部（Private）：电池、马达、线路，外面看不见也摸不着；外部（Public）：遥控器和开关，谁都能用。用的人不用知道里面怎么工作，会按遥控器就行。",
  },
  {
    slot: "classObject",
    title: "类与对象：模板和实例",
    categoryName: "编程",
    points:
      "类（Class）是模板，对象（Object）是按模板做出来的具体实例。属性 = 有什么（名字、年龄、颜色、品种）；方法 = 能做什么（叫、跑、吃、睡）。哈士奇、土狗、柴犬、拉布拉多都抽象成 Dog 类，再按模板创建出具体的对象，比如 2 岁的「刀盾狗」。",
  },
  {
    slot: "abstractionFruit",
    title: "抽象与类：模板是怎么来的",
    categoryName: "编程",
    points:
      "抽象，就是把一类东西的共同点提炼出来：苹果、香蕉、梨各不相同，共同点是「都能吃」，就抽象成「水果」这一类。类就是抽象出来的模板，里面定两样东西：属性（有什么）和方法（能做什么）；填不同的参数进去，就能造出不同的对象。和函数一样，都是把规律先提炼成一个模板，再反复使用。",
  },
  {
    slot: "oopThree",
    title: "面向对象三要素：封装、继承、多态",
    categoryName: "编程",
    points:
      "封装：把类内部的细节藏起来，只留接口给外面用。继承：子类自动拥有父类的属性和方法，还能加自己的新本领——比如学生、员工都继承「人类」，人类会的东西他们都会。多态：同一个方法，不同的对象做起来样子不同——小狗「叫」是汪汪，小猫「叫」是喵喵。",
  },
  {
    slot: "classMold",
    title: "类是模具，对象是产品",
    categoryName: "编程",
    points:
      "类就像一张图纸、一个模具，定义了属性（特征）和方法（行为）。按图纸造出来的实物叫对象（实例）：class Cat 造出 cat1 汤姆（黑色）和 cat2 泡面（白色）。__init__ 是初始化方法，创建对象时自动运行，负责给属性赋上初值。一个模具，可以生产出许多不同的产品。",
  },
  {
    slot: "pythonSymbols",
    title: "Python 符号通关：点号、括号、冒号",
    categoryName: "编程",
    points:
      "class 是定义类的关键字，后面的冒号 : 表示「代码块从这里开始」；def __init__(self, …) 是初始化方法，self 指将来造出来的那一个对象；self.name = name 是把传进来的值装进属性，等号 = 是赋值；cat1.meow() 里的点号 . 是「访问它里面的东西」，小括号 () 是「启动这个动作」，千万不能忘；引号 \" \" 里是文字内容；# 后面是注释，写给人看的。",
  },
  {
    slot: "seqTrees",
    title: "等差数列像种树：为什么是 (n − 1)",
    categoryName: "数与计算",
    points:
      "等差数列就像一排等距离种下的树：走到第 n 棵树，只需要跨过 (n − 1) 个间隔；每个间隔就是公差 d。所以第 n 项 = 起点 a₁ + (n − 1) × d。记住这个画面，通项公式就不会记错。",
  },
  {
    slot: "elimination",
    title: "二元一次方程组：加减消元法",
    categoryName: "方程",
    points:
      "两个方程里，把同一个未知数的系数配成相同，两式相减就能消掉它。例：6x + 9y = 930 和 9x + 6y = 1020：x 的系数 6 和 9 的最小公倍数是 18，第一式 ×3、第二式 ×2，两式相减得 15y = 750，y = 50；代回去得 x = 80。验算：6 × 80 + 9 × 50 = 930 ✓。关键：先用最小公倍数把系数配齐，才能消元。",
  },
  {
    slot: "cowGrassParts",
    title: "牛吃草：设份数列方程组",
    categoryName: "应用题",
    points:
      "把每头牛每天吃的草量定为 1 份，设初始草量 x 份、每天新长 y 份。例：20 头牛 10 天吃完、15 头牛 20 天吃完：x + 10y = 20 × 10 = 200，x + 20y = 15 × 20 = 300，两式相减得 y = 10，再得 x = 100。彩蛋：每天新长的草正好够 10 头牛吃，所以最多养 10 头牛，草永远吃不完。",
  },
  {
    slot: "cowGrassForever",
    title: "牛吃草：什么时候草吃不完",
    categoryName: "应用题",
    points:
      "原有草量 75 份、每天长 15 份、z 头牛吃 t 天：75 + 15t = z × t，整理得 t = 75 ÷ (z − 15)。当 z ≤ 15，也就是牛每天吃掉的草不超过草每天新长的量，草永远吃不完；z 越大，吃完得越快。这个公式像花老本：能撑的天数 = 老本 ÷（每天开销 − 每天收入）。",
  },
  {
    slot: "plusOmit",
    title: "正数前面的\"+\"号可以省略",
    categoryName: "数与计算",
    points:
      "正数前面的 + 号一般可以省略，直接写数字就代表正数：+2 写成 2，+120 写成 120。注意：算式中间的 + 是加号，不能省：+10 + (+5) 简化成 10 + 5。把开头的 + 号省掉，算式更清晰，也不容易和加号混淆。",
  },
];

// The 7 cards of the v8 batch (2026-11-25): rational numbers (4) and
// inequalities (3), all with redrawn clean diagrams. The same seed run
// also swaps the images of 2 existing cards whose pictures are
// handwritten photos (see IMAGE_SWAPS_V8). Titles, categories, and
// 要点 are the user's own words, verbatim.
const SEED_CARDS_V8: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "rationalTree",
    title: "有理数全家福：分类图",
    categoryName: "数与计算",
    points:
      "有理数包括整数和分数。按符号分三大类：正有理数、0、负有理数；记住 0 既不是正数，也不是负有理数。整数里有正整数、0、负整数；分数里有正分数、负分数。有限小数和无限循环小数都能化成分数，所以它们也是有理数。",
  },
  {
    slot: "oppositeAbs",
    title: "相反数与绝对值",
    categoryName: "数与计算",
    points:
      "只有符号不同的两个数互为相反数：5 的相反数是 −5，0 的相反数还是 0。一个数在数轴上到原点的距离，叫它的绝对值：|−5| = 5，|5| = 5，|0| = 0，绝对值永远不会是负数。求法：正数取它本身，负数取它的相反数，0 还是 0。",
  },
  {
    slot: "rationalAddSub",
    title: "有理数加减法：同号异号分开算",
    categoryName: "数与计算",
    points:
      "加法：同号两数相加，取相同的符号，绝对值相加，如 (−3) + (−5) = −8；异号两数相加，取绝对值较大的符号，绝对值相减，如 (−7) + 4 = −3。减法：减去一个数，等于加上它的相反数，如 5 − (−2) = 5 + 2 = 7，−3 − 5 = −3 + (−5) = −8。所以减法最后都变成加法来算。",
  },
  {
    slot: "rationalMulDiv",
    title: "有理数乘除法：先定符号再算数",
    categoryName: "数与计算",
    points:
      "乘除法先定符号再算数：同号得正，异号得负，然后把绝对值相乘除。如 (−3) × (−4) = 12，(−3) × 5 = −15，(−12) ÷ (−3) = 4。除法还有一招：除以一个数，等于乘它的倒数，如 (−6) ÷ 2 = (−6) × 1/2 = −3。注意：0 不能作除数，0 没有倒数。",
  },
  {
    slot: "ineqProperties",
    title: "不等式三条基本性质",
    categoryName: "方程",
    points:
      "性质1：不等式两边加（或减）同一个数，不等号方向不变。性质2：两边乘（或除以）同一个正数，方向不变。性质3（最容易错）：两边乘（或除以）同一个负数，方向必须改变！例：由 −2x > 6，两边除以 −2，要变号，得 x < −3。",
  },
  {
    slot: "ineqSteps",
    title: "一元一次不等式：解法五步加数轴解集",
    categoryName: "方程",
    points:
      "解法和解方程一样五步：去分母、去括号、移项、合并同类项、系数化为 1；只有系数化 1 时除以负数才要变号。解集要画在数轴上：> 和 < 用空心圈，≥ 和 ≤ 用实心点；大于往右画，小于往左画。例：2x + 3 > 7，解得 x > 2，数轴上在 2 处画空心圈、向右画线。",
  },
  {
    slot: "ineqSystem",
    title: "不等式组：解集口诀",
    categoryName: "方程",
    points:
      "先把组里每个不等式分别解出来，再在数轴上找它们的公共部分。口诀：同大取大（x > 2 且 x > 5，取 x > 5）；同小取小（x < 2 且 x < 5，取 x < 2）；大小小大中间找（x > 2 且 x < 5，取 2 < x < 5）；大大小小无处找（x > 5 且 x < 2，无解）。",
  },
];

// Existing cards whose seed image is a handwritten photo; the v8 seed
// replaces just the picture with a clean redrawn diagram. A swap only
// happens while the card still carries its untouched v7 seed image
// (matched by the deterministic blob key) — a card the user edited,
// re-imaged, renamed, or deleted is never touched.
const IMAGE_SWAPS_V8: ReadonlyArray<{
  title: string;
  slot: string;
  fromKey: string;
  toKey: string;
}> = [
  {
    title: "牛吃草：什么时候草吃不完",
    slot: "cowGrassForeverNew",
    fromKey: "cards/seed-v7-cowGrassForever",
    toKey: "cards/seed-v8-cowGrassForever",
  },
  {
    title: "类是模具，对象是产品",
    slot: "classMoldNew",
    fromKey: "cards/seed-v7-classMold",
    toKey: "cards/seed-v8-classMold",
  },
];

// The 15 cards of the v9 batch (2026-11-25): Pythagoras x3,
// inequalities x4, coordinate plane x4, roots x4 — all with redrawn
// clean diagrams. Titles, categories, and 要点 are the user's own
// words, verbatim.
const SEED_CARDS_V9: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "pythagoras",
    title: "勾股定理：a² + b² = c²",
    categoryName: "几何",
    points:
      "在直角三角形里，两条直角边的平方和，等于斜边的平方：a² + b² = c²（c 是斜边）。面积上看：长在两条直角边上的正方形，加起来正好等于长在斜边上的正方形。例：直角边 3 和 4，斜边就是 5，因为 3² + 4² = 9 + 16 = 25 = 5²。已知两边求第三边：求斜边 c = √(a² + b²)；求直角边 a = √(c² − b²)。",
  },
  {
    slot: "pythagorasConverse",
    title: "勾股逆定理：判断是不是直角三角形",
    categoryName: "几何",
    points:
      "反过来用：如果一个三角形的三条边满足 a² + b² = c²（c 是最长边），那它就是直角三角形。例：5、12、13：5² + 12² = 25 + 144 = 169 = 13² ✓，是直角三角形。常用勾股数背下来：3、4、5；6、8、10；5、12、13；8、15、17。判断时先找最长边当 c，再算两小边的平方和对不对得上。",
  },
  {
    slot: "ladderWall",
    title: "勾股定理应用：梯子靠墙",
    categoryName: "应用题",
    points:
      "梯子、墙和地面正好围成一个直角三角形。例：一架梯子长 5 米，斜靠在墙上，梯子脚离墙 3 米，问梯子顶到地面多高？高 = √(5² − 3²) = √(25 − 9) = √16 = 4 米。生活里求高度、求距离、求对角线，常常就是先找出那个藏起来的直角三角形，再用 a² + b² = c²。",
  },
  {
    slot: "ineqSymbols",
    title: "认识不等号：五种符号",
    categoryName: "方程",
    points:
      "表示大小关系的符号有五个：> 大于、< 小于、≥ 大于或等于（不小于）、≤ 小于或等于（不大于）、≠ 不等于。开口朝着大的数，尖角朝着小的数。≥ 和 ≤ 都带一个等号，意思是「可以相等」：x ≥ 3 表示 x 可以是 3，也可以比 3 大。",
  },
  {
    slot: "ineqKeywords",
    title: "列不等式：关键词定方向",
    categoryName: "应用题",
    points:
      "列不等式先找关键词定方向：超过、多于 → >；低于、少于 → <；不超过、至多、最多 → ≤；不低于、至少、最少 → ≥。例：限速 60 就是速度 ≤ 60；身高至少 1.2 米才能坐过山车，就是身高 ≥ 1.2；买 3 支笔不超过 20 元，就是 3x ≤ 20。看到「至少、不低于」别写成 >，要带等号。",
  },
  {
    slot: "ineqInteger",
    title: "不等式的整数解：正整数解和最大整数解",
    categoryName: "方程",
    points:
      "不等式的解有很多个，常考的是整数解。例1：x < 5 的正整数解是 1、2、3、4（0 不是正整数，5 取不到）。例2：2x − 1 ≤ 7，解得 x ≤ 4，它的最大整数解是 4，非负整数解是 0、1、2、3、4。做法：先解出范围，再在数轴上数整数点，注意端点取得到取不到。",
  },
  {
    slot: "ineqSystemExample",
    title: "不等式组例题：数轴上找公共部分",
    categoryName: "方程",
    points:
      "例：解不等式组 x + 1 > 3 和 2x ≤ 8。先分别解：第一个得 x > 2，第二个得 x ≤ 4。把两个解集画在同一条数轴上，重叠的那段就是答案：2 < x ≤ 4。注意端点：2 是空心圈（取不到），4 是实心点（取得到）。两个解集没有重叠部分时，不等式组无解。",
  },
  {
    slot: "coordSystem",
    title: "平面直角坐标系：横轴、纵轴和原点",
    categoryName: "几何",
    points:
      "两条互相垂直的数轴组成平面直角坐标系：水平的叫 x 轴（横轴），竖直的叫 y 轴（纵轴），交点叫原点 O，坐标 (0, 0)。平面被两轴分成四个象限。点 P 的坐标记作 (x, y)：先横后纵，中间逗号隔开，外面括号括好。例：P(3, 2) 表示从原点向右走 3、再向上走 2 到达的位置。",
  },
  {
    slot: "coordQuadrants",
    title: "四个象限的符号规律",
    categoryName: "几何",
    points:
      "从右上开始逆时针数：第一象限 (+, +)、第二象限 (−, +)、第三象限 (−, −)、第四象限 (+, −)。口诀：一正正、二负正、三负负、四正负。注意：坐标轴上的点不属于任何象限——x 轴上的点纵坐标是 0，如 (3, 0)；y 轴上的点横坐标是 0，如 (0, −2)。",
  },
  {
    slot: "coordDistance",
    title: "点到两轴的距离：取绝对值",
    categoryName: "几何",
    points:
      "点 P(x, y) 到 x 轴的距离 = |y|，到 y 轴的距离 = |x|。距离是长度，永远不取负数，所以要加绝对值。例：P(−3, 4) 到 x 轴的距离是 4，到 y 轴的距离是 3。易错点：到 x 轴看纵坐标，到 y 轴看横坐标，别看反了。",
  },
  {
    slot: "coordSymmetry",
    title: "对称点坐标：谁对称谁变号",
    categoryName: "几何",
    points:
      "点 (x, y) 关于 x 轴对称，横坐标不变、纵坐标变号 → (x, −y)；关于 y 轴对称，纵坐标不变、横坐标变号 → (−x, y)；关于原点对称，两个坐标都变号 → (−x, −y)。例：(2, 3) 关于 x 轴的对称点是 (2, −3)，关于 y 轴是 (−2, 3)，关于原点是 (−2, −3)。口诀：关于谁对称，谁就不变，另一个变号；关于原点，两个都变。",
  },
  {
    slot: "sqrtBasic",
    title: "平方根与算术平方根",
    categoryName: "数与计算",
    points:
      "如果 x² = a，那么 x 就叫做 a 的平方根。正数有两个平方根，互为相反数：25 的平方根是 5 和 −5，记作 ±5；0 的平方根只有 0；负数没有平方根。其中正的那个平方根叫算术平方根：25 的算术平方根是 5，记作 √25 = 5。√ 叫根号，根号下面的数（被开方数）不能是负数。",
  },
  {
    slot: "sqrtTable",
    title: "开平方：先背平方数表",
    categoryName: "数与计算",
    points:
      "开平方是平方的逆运算，先把常见平方数背熟：1²=1，2²=4，3²=9，4²=16，5²=25，6²=36，7²=49，8²=64，9²=81，10²=100，11²=121，12²=144，13²=169，14²=196，15²=225。看到 √144 就反着查表，得 12。不是完全平方数也能估：√50 在 7 和 8 之间（49 < 50 < 64），大约是 7.1。",
  },
  {
    slot: "sqrtSimplify",
    title: "二次根式化简与加减乘除",
    categoryName: "数与计算",
    points:
      "化简：√(a×b) = √a × √b（a、b 都不小于 0），如 √12 = √(4×3) = 2√3。加减：化成最简后，根号里相同的才能合并，如 √18 + √8 = 3√2 + 2√2 = 5√2。乘法：√3 × √6 = √18 = 3√2。分母有根号要化掉（分母有理化）：1/√2 = √2/2（分子分母同乘 √2）。",
  },
  {
    slot: "cbrtCompare",
    title: "立方根：负数也有份",
    categoryName: "数与计算",
    points:
      "如果 x³ = a，那么 x 叫做 a 的立方根，记作 ³√a。每个数都有一个立方根：正数的立方根是正数，负数的立方根是负数，0 的立方根是 0。例：³√27 = 3，³√(−8) = −2。和平方根的两个区别：① 负数没有平方根，但有立方根；② 立方根只有一个，不用写 ±。",
  },
];

const SEED_CARDS_V10: ReadonlyArray<{
  slot: string;
  title: string;
  categoryName: string;
  points: string;
}> = [
  {
    slot: "vectorBasic",
    title: "什么是向量：有大小又有方向",
    categoryName: "几何",
    points:
      "向量是既有大小、又有方向的量，用带箭头的线段表示，记作 AB→ 或 a→。向量的大小叫模，记作 |a→|，就是线段的长度。只有大小、没有方向的量叫数量（也叫标量），比如长度、质量。两个特别的向量：零向量的模是 0，方向任意；单位向量的模是 1。大小相等、方向相同的向量叫相等向量。",
  },
  {
    slot: "vectorAddSub",
    title: "向量的加法和减法：首尾相连",
    categoryName: "几何",
    points:
      "加法三角形法则：把第二个向量的起点搬到第一个向量的终点（首尾相连），和向量从第一个的起点指向第二个的终点。平行四边形法则：两个向量同起点时，和向量是它们围成的平行四边形的对角线。减法：a→ − b→ 等于加上 −b→；两个向量同起点时，差向量从减向量的终点指向被减向量的终点。坐标算法：a→ = (x₁, y₁)，b→ = (x₂, y₂)，则 a→ + b→ = (x₁ + x₂, y₁ + y₂)，减法同理。",
  },
  {
    slot: "vectorCoord",
    title: "向量的坐标、模和数乘",
    categoryName: "几何",
    points:
      "向量可以用坐标表示：a→ = (x, y)。模长用勾股定理算：|a→| = √(x² + y²)，例：a→ = (3, 4) 的模是 √(9 + 16) = 5。数乘：λa→ = (λx, λy)：λ > 0 时方向相同，λ < 0 时方向相反，λ = 0 时变成零向量；模变成原来的 |λ| 倍。",
  },
  {
    slot: "vectorDot",
    title: "向量的数量积：算夹角、判垂直",
    categoryName: "几何",
    points:
      "数量积 a→ · b→ = |a→| × |b→| × cosθ（θ 是两向量的夹角），算出来是一个数，不是向量。用坐标算更方便：a→ · b→ = x₁x₂ + y₁y₂。判垂直最好用：a→ ⊥ b→ 当且仅当 a→ · b→ = 0。例：(1, 2) · (2, −1) = 2 − 2 = 0，所以这两个向量互相垂直。",
  },
];

// ---------- helpers ----------

import type { Ctx } from "@hatch/space-sdk";

async function buildLibrary(ctx: Ctx): Promise<z.infer<typeof libraryResponse>> {
  const db = ctx.db<typeof schema>();
  const catRows = await db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.id));
  const cardRows = await db
    .select()
    .from(schema.cards)
    .orderBy(desc(schema.cards.createdAt), desc(schema.cards.id));

  const counts = new Map<number, number>();
  for (const row of cardRows) {
    counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1);
  }

  const cards: z.infer<typeof cardShape>[] = [];
  for (const row of cardRows) {
    cards.push({
      id: row.id,
      title: row.title,
      points: row.points,
      category_id: row.categoryId,
      image_url: row.imageBlobKey
        ? await ctx.blobs.getUrl(row.imageBlobKey)
        : null,
      created_at: row.createdAt.toISOString(),
    });
  }

  return {
    categories: catRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      card_count: counts.get(row.id) ?? 0,
    })),
    cards,
  };
}

async function requireCategory(ctx: Ctx, categoryId: number) {
  const db = ctx.db<typeof schema>();
  const rows = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, categoryId))
    .limit(1);
  const cat = rows[0];
  if (!cat) throw new Error("所选分类不存在，请重新选一个分类。");
  return cat;
}

async function storeImage(
  ctx: Ctx,
  image: z.infer<typeof imageInput>,
): Promise<string> {
  if (!IMAGE_MIMES.includes(image.mimeType)) {
    throw new Error("图片只支持 JPG、PNG 或 WebP 格式。");
  }
  const key = `cards/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const bytes = Buffer.from(image.dataBase64, "base64");
  await ctx.blobs.put(key, bytes, { contentType: image.mimeType });
  return key;
}

async function cardOut(
  ctx: Ctx,
  row: typeof schema.cards.$inferSelect,
): Promise<z.infer<typeof cardShape>> {
  return {
    id: row.id,
    title: row.title,
    points: row.points,
    category_id: row.categoryId,
    image_url: row.imageBlobKey
      ? await ctx.blobs.getUrl(row.imageBlobKey)
      : null,
    created_at: row.createdAt.toISOString(),
  };
}

export const Actions = {
  getLibrary: defineAction({
    description:
      "读取全部数学知识卡和分类（含每类的卡片数），按分类顺序和卡片最新优先返回，供首页展示与筛选。",
    request: z.object({}),
    response: libraryResponse,
    handler: async (ctx): Promise<z.infer<typeof libraryResponse>> => {
      return await buildLibrary(ctx);
    },
  }),

  seedLibrary: defineAction({
    description:
      "首次使用时放入预置的 6 个分类和 4 张起始知识卡（三张用用户发来的原图，和的平方卡用重画的干净面积示意图）；只在从未播种过时执行，重复调用不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImages],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v2"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      // Preset categories (skip any that somehow already exist).
      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      // Starter cards, with the user's original images as blobs.
      const { images } = await ctx.executePrivileged(
        privileged.readSeedImages,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      let seededCards = 0;
      const existingCards = await db
        .select({ id: schema.cards.id })
        .from(schema.cards)
        .limit(1);
      if (existingCards.length === 0) {
        for (const def of SEED_CARDS) {
          const cat = catByName.get(def.categoryName);
          if (!cat) continue;
          let blobKey: string | null = null;
          const img = imageBySlot.get(def.slot);
          if (img) {
            blobKey = `cards/seed-${def.slot}`;
            await ctx.blobs.put(
              blobKey,
              Buffer.from(img.dataBase64, "base64"),
              { contentType: img.mimeType },
            );
          }
          await db.insert(schema.cards).values({
            title: def.title,
            points: def.points,
            categoryId: cat.id,
            imageBlobKey: blobKey,
          });
          seededCards += 1;
        }
      } else {
        // Library was seeded by v1 with the video-screenshot photo for the
        // 和的平方 card. v2 replaces just that image in place: the seed blob
        // key is deterministic, so re-putting the clean diagram at the same
        // key swaps the picture without touching the card or its text.
        const img = imageBySlot.get("sumSquare");
        if (img) {
          await ctx.blobs.put(
            "cards/seed-sumSquare",
            Buffer.from(img.dataBase64, "base64"),
            { contentType: img.mimeType },
          );
        }
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v2", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV3: defineAction({
    description:
      "把 2026-11-25 用户发来的两批图片提炼成的 13 张新卡放入卡库（4 张成品教学图用原图、9 张重画干净示意图）；只在从未播种过 v3 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV3],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v3"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      // Categories these cards file under (normally already present from
      // the v1/v2 seed; insert any missing one without touching existing).
      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV3,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      // Skip any card whose title is already in the library, so a library
      // that somehow got these cards another way is never duplicated.
      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V3) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v3-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v3", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV4: defineAction({
    description:
      "把 2026-11-25 第三批图片提炼成的 6 张新卡放入卡库（3 张成品教学图用原图、3 张重画干净示意图）；只在从未播种过 v4 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV4],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v4"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV4,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V4) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v4-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v4", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV5: defineAction({
    description:
      "把 2026-11-25 第四批图片提炼成的 5 张新卡放入卡库（2 张成品教学图用原图、3 张重画干净示意图）；只在从未播种过 v5 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV5],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v5"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV5,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V5) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v5-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v5", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV6: defineAction({
    description:
      "把 2026-11-25 第五批里的 3 张数学卡放入卡库（配图全部重画成干净示意图；同批的 7 张编程图不入卡）；只在从未播种过 v6 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV6],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v6"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV6,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V6) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v6-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v6", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV7: defineAction({
    description:
      "把 2026-11-25 留下的 6 张编程卡（新分类「编程」）、最新一批 4 张卡和再下一批 1 张卡放入卡库（5 张成品图用原图、6 张重画干净示意图）；只在从未播种过 v7 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV7],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v7"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      // The new 编程 category the user asked for (skip if it somehow
      // already exists — e.g. the user added it by hand).
      const beforeCats = await db.select().from(schema.categories);
      if (!beforeCats.some((c) => c.name === "编程")) {
        const maxSort = beforeCats.reduce(
          (m, c) => Math.max(m, c.sortOrder),
          -1,
        );
        await db
          .insert(schema.categories)
          .values({ name: "编程", color: "amber", sortOrder: maxSort + 1 })
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV7,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V7) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v7-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v7", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV8: defineAction({
    description:
      "放入 2026-11-25 新补的 7 张卡（有理数 4 张、不等式 3 张，配图全部重画成干净示意图），并把两张配图是手写稿照片的旧卡（牛吃草：什么时候草吃不完、类是模具，对象是产品）换成重画版图片；只动仍挂着原播种图的那两张卡，标题、分类、要点一律不改；只在从未播种过 v8 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV8],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v8"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV8,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V8) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v8-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      // Swap the two handwritten-photo images for clean redraws. Only
      // the image_blob_key changes; the guard on fromKey means a card
      // the user has since edited or re-imaged is left exactly as is.
      for (const swap of IMAGE_SWAPS_V8) {
        const img = imageBySlot.get(swap.slot);
        if (!img) continue;
        const rows = await db
          .select()
          .from(schema.cards)
          .where(eq(schema.cards.title, swap.title));
        for (const row of rows) {
          if (row.imageBlobKey !== swap.fromKey) continue;
          await ctx.blobs.put(
            swap.toKey,
            Buffer.from(img.dataBase64, "base64"),
            { contentType: img.mimeType },
          );
          await db
            .update(schema.cards)
            .set({ imageBlobKey: swap.toKey })
            .where(eq(schema.cards.id, row.id));
        }
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v8", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV9: defineAction({
    description:
      "放入 2026-11-25 新补的 15 张卡（勾股定理 3 张、不等式 4 张、平面直角坐标系 4 张、平方根与立方根 4 张，配图全部重画成干净示意图）；只在从未播种过 v9 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV9],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v9"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV9,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V9) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v9-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v9", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  seedLibraryV10: defineAction({
    description:
      "放入 2026-11-25 新补的 4 张向量卡（全部放「几何」，配图全部重画成干净示意图）；只在从未播种过 v10 时执行，重复调用不会重复加卡、不会覆盖用户后来的修改。",
    request: z.object({}),
    response: seedResponse,
    privileged: [privileged.readSeedImagesV10],
    handler: async (ctx): Promise<z.infer<typeof seedResponse>> => {
      const db = ctx.db<typeof schema>();
      const seededRows = await db
        .select()
        .from(schema.meta)
        .where(eq(schema.meta.key, "seeded_v10"))
        .limit(1);
      if (seededRows.length > 0) {
        return { seeded: false, seeded_cards: 0 };
      }

      for (const preset of PRESET_CATEGORIES) {
        await db
          .insert(schema.categories)
          .values(preset)
          .onConflictDoNothing();
      }
      const catRows = await db.select().from(schema.categories);
      const catByName = new Map(catRows.map((c) => [c.name, c]));

      const { images } = await ctx.executePrivileged(
        privileged.readSeedImagesV10,
        {},
      );
      const imageBySlot = new Map(images.map((i) => [i.slot, i]));

      const existingTitles = new Set(
        (await db.select({ title: schema.cards.title }).from(schema.cards)).map(
          (r) => r.title,
        ),
      );

      let seededCards = 0;
      for (const def of SEED_CARDS_V10) {
        const cat = catByName.get(def.categoryName);
        if (!cat || existingTitles.has(def.title)) continue;
        let blobKey: string | null = null;
        const img = imageBySlot.get(def.slot);
        if (img) {
          blobKey = `cards/seed-v10-${def.slot}`;
          await ctx.blobs.put(blobKey, Buffer.from(img.dataBase64, "base64"), {
            contentType: img.mimeType,
          });
        }
        await db.insert(schema.cards).values({
          title: def.title,
          points: def.points,
          categoryId: cat.id,
          imageBlobKey: blobKey,
        });
        seededCards += 1;
      }

      await db
        .insert(schema.meta)
        .values({ key: "seeded_v10", value: "1" })
        .onConflictDoNothing();
      ctx.invalidateQueries();
      return { seeded: true, seeded_cards: seededCards };
    },
  }),

  addCategory: defineAction({
    description: "新增一个知识分类，颜色按色板自动轮换分配。",
    request: z.object({
      name: z.string().trim().min(1, "分类名不能为空").max(30),
    }),
    response: categoryResponse,
    handler: async (ctx, args): Promise<z.infer<typeof categoryResponse>> => {
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.categories);
      if (existing.some((c) => c.name === args.name)) {
        throw new Error("已经有这个分类啦，换个名字试试。");
      }
      const maxSort = existing.reduce((m, c) => Math.max(m, c.sortOrder), -1);
      const color = PALETTE[existing.length % PALETTE.length] ?? "orange";
      const inserted = await db
        .insert(schema.categories)
        .values({ name: args.name, color, sortOrder: maxSort + 1 })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("addCategory: insert returned no rows");
      ctx.invalidateQueries();
      return {
        category: { id: row.id, name: row.name, color: row.color, card_count: 0 },
      };
    },
  }),

  renameCategory: defineAction({
    description: "给一个分类改名。",
    request: z.object({
      id: z.number().int().positive(),
      name: z.string().trim().min(1, "分类名不能为空").max(30),
    }),
    response: doneResponse,
    handler: async (ctx, args): Promise<z.infer<typeof doneResponse>> => {
      const db = ctx.db<typeof schema>();
      const cat = await requireCategory(ctx, args.id);
      const all = await db.select().from(schema.categories);
      if (all.some((c) => c.id !== args.id && c.name === args.name)) {
        throw new Error("已经有这个分类啦，换个名字试试。");
      }
      void cat;
      await db
        .update(schema.categories)
        .set({ name: args.name })
        .where(eq(schema.categories.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  deleteCategory: defineAction({
    description:
      "删除一个分类；分类里还有卡片时会拒绝，并提示先移走或删掉卡片。",
    request: z.object({ id: z.number().int().positive() }),
    response: doneResponse,
    handler: async (ctx, args): Promise<z.infer<typeof doneResponse>> => {
      const db = ctx.db<typeof schema>();
      const cat = await requireCategory(ctx, args.id);
      const cardsInCat = await db
        .select({ id: schema.cards.id })
        .from(schema.cards)
        .where(eq(schema.cards.categoryId, args.id));
      if (cardsInCat.length > 0) {
        throw new Error(
          `「${cat.name}」里还有 ${cardsInCat.length} 张卡片，先把卡片改到别的分类或删掉，再来删这个分类。`,
        );
      }
      await db
        .delete(schema.categories)
        .where(eq(schema.categories.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  addCard: defineAction({
    description:
      "新增一张知识卡：标题、分类、要点文字，可带一张知识点总结图（base64）。",
    request: z.object({
      title: z.string().trim().min(1, "标题不能为空").max(120),
      points: z.string().trim().max(2000).default(""),
      categoryId: z.number().int().positive(),
      image: imageInput.nullable().default(null),
    }),
    response: cardResponse,
    handler: async (ctx, args): Promise<z.infer<typeof cardResponse>> => {
      await requireCategory(ctx, args.categoryId);
      const db = ctx.db<typeof schema>();
      const blobKey = args.image ? await storeImage(ctx, args.image) : null;
      const inserted = await db
        .insert(schema.cards)
        .values({
          title: args.title,
          points: args.points,
          categoryId: args.categoryId,
          imageBlobKey: blobKey,
        })
        .returning();
      const row = inserted[0];
      if (!row) throw new Error("addCard: insert returned no rows");
      ctx.invalidateQueries();
      return { card: await cardOut(ctx, row) };
    },
  }),

  updateCard: defineAction({
    description:
      "编辑一张知识卡的标题、分类和要点；传了新图就换图，removeImage 为 true 就去掉图，都不传则保留原图。",
    request: z.object({
      id: z.number().int().positive(),
      title: z.string().trim().min(1, "标题不能为空").max(120),
      points: z.string().trim().max(2000).default(""),
      categoryId: z.number().int().positive(),
      image: imageInput.nullable().default(null),
      removeImage: z.boolean().default(false),
    }),
    response: cardResponse,
    handler: async (ctx, args): Promise<z.infer<typeof cardResponse>> => {
      await requireCategory(ctx, args.categoryId);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.id, args.id))
        .limit(1);
      const existing = rows[0];
      if (!existing) throw new Error("这张卡片已经不存在了。");

      let blobKey = existing.imageBlobKey;
      if (args.image) {
        blobKey = await storeImage(ctx, args.image);
      } else if (args.removeImage) {
        blobKey = null;
      }
      const oldKey = existing.imageBlobKey;

      const updated = await db
        .update(schema.cards)
        .set({
          title: args.title,
          points: args.points,
          categoryId: args.categoryId,
          imageBlobKey: blobKey,
          updatedAt: new Date(),
        })
        .where(eq(schema.cards.id, args.id))
        .returning();
      const row = updated[0];
      if (!row) throw new Error("updateCard: update returned no rows");

      if (oldKey && oldKey !== blobKey) {
        try {
          await ctx.blobs.delete(oldKey);
        } catch {
          // old blob cleanup is best-effort
        }
      }
      ctx.invalidateQueries();
      return { card: await cardOut(ctx, row) };
    },
  }),

  deleteCard: defineAction({
    description: "删除一张知识卡（连同它的图片）。",
    request: z.object({ id: z.number().int().positive() }),
    response: doneResponse,
    handler: async (ctx, args): Promise<z.infer<typeof doneResponse>> => {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.id, args.id))
        .limit(1);
      const existing = rows[0];
      if (!existing) throw new Error("这张卡片已经不存在了。");
      await db.delete(schema.cards).where(eq(schema.cards.id, args.id));
      if (existing.imageBlobKey) {
        try {
          await ctx.blobs.delete(existing.imageBlobKey);
        } catch {
          // blob cleanup is best-effort
        }
      }
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),
} satisfies ActionsModule;
