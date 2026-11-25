// 小孩数学空间: a bright wall of math knowledge cards, filed by category.
// Big type, big tap targets, phone-first — a kid should be able to read
// every card without zooming, and a parent should be able to file a new
// card in seconds.

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fileToBase64 } from "@hatch/space-sdk/client";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import { api, type ApiResponse } from "./api";

const FIELDS = actionFields<typeof Actions>();

type Library = ApiResponse<typeof api, "getLibrary">;
type Card = Library["cards"][number];
type Category = Library["categories"][number];

const COLORS: Record<string, string> = {
  coral: "#FF5A5F",
  blue: "#2E9BFF",
  purple: "#8B5CF6",
  green: "#22B573",
  teal: "#00A896",
  pink: "#FF6FA5",
  orange: "#FF8A00",
  amber: "#D9930D",
};
const colorOf = (key: string): string => COLORS[key] ?? "#FF8A00";

type ImageState =
  | { kind: "keep" }
  | { kind: "none" }
  | { kind: "new"; dataBase64: string; mimeType: string; previewUrl: string };

export function App() {
  const queryClient = useQueryClient();
  const library = useQuery({
    queryKey: ["library"],
    queryFn: () => api.getLibrary({}),
  });

  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [editorCard, setEditorCard] = useState<Card | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Card | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Esc closes the fullscreen image viewer (mouse/keyboard devices).
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // One-time seeding of the preset categories + the 4 starter cards.
  const seedRef = useRef(false);
  const seed = useMutation({
    mutationFn: () => api.seedLibrary({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedRef.current) return;
    if (
      library.data.categories.length === 0 &&
      library.data.cards.length === 0
    ) {
      seedRef.current = true;
      seed.mutate();
    }
  }, [library.data, seed]);

  // One-time seeding of the 13 cards from the 2026-11-25 batches. The
  // action itself is idempotent (meta flag server-side), so this ref is
  // only to avoid firing it on every render.
  const seedV3Ref = useRef(false);
  const seedV3 = useMutation({
    mutationFn: () => api.seedLibraryV3({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV3Ref.current) return;
    seedV3Ref.current = true;
    seedV3.mutate();
  }, [library.data, seedV3]);

  // One-time seeding of the 6 cards from the third 2026-11-25 batch.
  // Same pattern as the v3 seed: the action is idempotent server-side.
  const seedV4Ref = useRef(false);
  const seedV4 = useMutation({
    mutationFn: () => api.seedLibraryV4({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV4Ref.current) return;
    seedV4Ref.current = true;
    seedV4.mutate();
  }, [library.data, seedV4]);

  // One-time seeding of the 5 cards from the fourth 2026-11-25 batch.
  // Same pattern as the v4 seed: the action is idempotent server-side.
  const seedV5Ref = useRef(false);
  const seedV5 = useMutation({
    mutationFn: () => api.seedLibraryV5({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV5Ref.current) return;
    seedV5Ref.current = true;
    seedV5.mutate();
  }, [library.data, seedV5]);

  // One-time seeding of the 3 math cards from the fifth 2026-11-25
  // batch. Same pattern as the v5 seed: the action is idempotent
  // server-side.
  const seedV6Ref = useRef(false);
  const seedV6 = useMutation({
    mutationFn: () => api.seedLibraryV6({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV6Ref.current) return;
    seedV6Ref.current = true;
    seedV6.mutate();
  }, [library.data, seedV6]);

  // One-time seeding of the 6 programming cards (new 编程 category),
  // the 4 cards from the sixth 2026-11-25 batch, and 1 card from the
  // seventh batch. Same pattern as the v6 seed: the action is
  // idempotent server-side.
  const seedV7Ref = useRef(false);
  const seedV7 = useMutation({
    mutationFn: () => api.seedLibraryV7({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV7Ref.current) return;
    seedV7Ref.current = true;
    seedV7.mutate();
  }, [library.data, seedV7]);

  // One-time seeding of the 7 rational-number / inequality cards, plus
  // the image swap for the 2 cards whose pictures are handwritten
  // photos. Same pattern as the v7 seed: the action is idempotent
  // server-side and never overwrites user edits.
  const seedV8Ref = useRef(false);
  const seedV8 = useMutation({
    mutationFn: () => api.seedLibraryV8({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV8Ref.current) return;
    seedV8Ref.current = true;
    seedV8.mutate();
  }, [library.data, seedV8]);

  // One-time seeding of the 15 cards from the v9 batch (Pythagoras,
  // inequalities, coordinate plane, roots). Same pattern as the v8
  // seed: the action is idempotent server-side.
  const seedV9Ref = useRef(false);
  const seedV9 = useMutation({
    mutationFn: () => api.seedLibraryV9({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV9Ref.current) return;
    seedV9Ref.current = true;
    seedV9.mutate();
  }, [library.data, seedV9]);

  // One-time seeding of the 4 vector cards. Same pattern as the v9
  // seed: the action is idempotent server-side.
  const seedV10Ref = useRef(false);
  const seedV10 = useMutation({
    mutationFn: () => api.seedLibraryV10({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV10Ref.current) return;
    seedV10Ref.current = true;
    seedV10.mutate();
  }, [library.data, seedV10]);

  // One-time seeding of the 4 整式运算 cards (new category). Same
  // pattern as the v10 seed: the action is idempotent server-side.
  const seedV11Ref = useRef(false);
  const seedV11 = useMutation({
    mutationFn: () => api.seedLibraryV11({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedV11Ref.current) return;
    seedV11Ref.current = true;
    seedV11.mutate();
  }, [library.data, seedV11]);

  // One-time seeding of the practice questions (batches A–D, 3 per
  // card). The action only fills cards whose practice is still empty,
  // so user-written practice is never overwritten.
  const seedPracticeRef = useRef(false);
  const seedPractice = useMutation({
    mutationFn: () => api.seedPractice({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  useEffect(() => {
    if (!library.data || seedPracticeRef.current) return;
    seedPracticeRef.current = true;
    seedPractice.mutate();
  }, [library.data, seedPractice]);

  const categories = useMemo(
    () => library.data?.categories ?? [],
    [library.data],
  );
  const allCards = useMemo(() => library.data?.cards ?? [], [library.data]);
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const visibleCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCards.filter((card) => {
      if (selectedCategory !== "all" && card.category_id !== selectedCategory)
        return false;
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.points.toLowerCase().includes(q)
      );
    });
  }, [allCards, selectedCategory, search]);

  const openAdd = () => {
    setEditorCard(null);
    setEditorOpen(true);
  };
  const openEdit = (card: Card) => {
    setEditorCard(card);
    setEditorOpen(true);
  };

  const isSeeding =
    library.data &&
    library.data.categories.length === 0 &&
    library.data.cards.length === 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sticky top bar: search + add + category filter */}
      <header className="sticky top-0 z-20 bg-[var(--bg)]/95 pt-safe backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-3 md:max-w-[1240px]">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="card-search">
              搜索卡片
            </label>
            <input
              id="card-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜一搜：十字相乘、括号…"
              className="min-w-0 flex-1 rounded-full border-[3px] border-[var(--border)] bg-white px-4 py-2 text-[17px] outline-none placeholder:text-[#B8A88F] focus:border-[var(--accent)] md:max-w-[400px] lg:max-w-[460px]"
            />
            <button
              type="button"
              onClick={openAdd}
              className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-2 text-[17px] font-extrabold text-white shadow-sm active:scale-95"
            >
              ＋ 新卡片
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full border-[3px] px-4 py-1.5 text-[16px] font-bold active:scale-95 ${
                selectedCategory === "all"
                  ? "border-[#2B2118] bg-[#2B2118] text-white"
                  : "border-[var(--border)] bg-white text-[var(--text)]"
              }`}
            >
              全部（{allCards.length}）
            </button>
            {categories.map((cat) => {
              const color = colorOf(cat.color);
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full border-[3px] px-4 py-1.5 text-[16px] font-bold active:scale-95"
                  style={
                    active
                      ? { backgroundColor: color, borderColor: color, color: "#fff" }
                      : { backgroundColor: "#fff", borderColor: color, color }
                  }
                >
                  {cat.name}（{cat.card_count}）
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="rounded-full border-[3px] border-dashed border-[#D8C6A5] bg-transparent px-4 py-1.5 text-[16px] font-bold text-[var(--dim)] active:scale-95"
            >
              管理分类
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-2 md:max-w-[1240px]">
        {notice && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#FF5A5F] bg-[#FFF1F1] px-4 py-3 text-[16px] font-bold text-[#B3261E]"
          >
            <span>{notice}</span>
            <button
              type="button"
              aria-label="关掉提示"
              onClick={() => setNotice(null)}
              className="shrink-0 px-2 text-[20px] leading-none"
            >
              ×
            </button>
          </div>
        )}

        {library.isPending && (
          <p className="py-16 text-center text-[20px] font-bold text-[var(--dim)]">
            正在翻卡片…
          </p>
        )}

        {library.isError && (
          <div className="py-16 text-center">
            <p className="text-[20px] font-bold">卡片没打开，再试一次吧。</p>
            <button
              type="button"
              onClick={() => library.refetch()}
              className="mt-4 rounded-full bg-[var(--accent)] px-6 py-2 text-[17px] font-extrabold text-white active:scale-95"
            >
              重新加载
            </button>
          </div>
        )}

        {isSeeding && seed.isError && (
          <div className="py-16 text-center">
            <p className="text-[20px] font-bold">起始卡片没放进来。</p>
            <button
              type="button"
              onClick={() => seed.mutate()}
              className="mt-4 rounded-full bg-[var(--accent)] px-6 py-2 text-[17px] font-extrabold text-white active:scale-95"
            >
              再试一次
            </button>
          </div>
        )}

        {isSeeding && !seed.isError && (
          <p className="py-16 text-center text-[20px] font-bold text-[var(--dim)]">
            正在把第一批卡片放进来…
          </p>
        )}

        {library.data && !isSeeding && allCards.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[22px] font-extrabold">还没有卡片</p>
            <p className="mt-2 text-[17px] text-[var(--dim)]">
              看到好的知识点总结图，点「＋ 新卡片」收进来，按分类放好。
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-5 rounded-full bg-[var(--accent)] px-6 py-2.5 text-[18px] font-extrabold text-white active:scale-95"
            >
              ＋ 收第一张卡片
            </button>
          </div>
        )}

        {library.data && !isSeeding && allCards.length > 0 && (
          <>
            <p className="mb-3 text-[15px] font-bold text-[var(--dim)]">
              {search.trim()
                ? `找到 ${visibleCards.length} 张卡片`
                : selectedCategory === "all"
                  ? `一共 ${visibleCards.length} 张卡片`
                  : `${categoryById.get(selectedCategory)?.name ?? ""} · ${visibleCards.length} 张`}
            </p>
            {visibleCards.length === 0 ? (
              <p className="py-12 text-center text-[19px] font-bold text-[var(--dim)]">
                没找到这样的卡片，换个词试试，或者看看其他分类。
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 min-[1000px]:grid-cols-4 xl:grid-cols-5">
                {visibleCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    category={categoryById.get(card.category_id)}
                    onOpenImage={() => setLightbox(card)}
                    onEdit={() => openEdit(card)}
                    onDeleteError={setNotice}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {editorOpen && (
        <CardEditor
          card={editorCard}
          categories={categories}
          defaultCategoryId={
            selectedCategory === "all" ? undefined : selectedCategory
          }
          onClose={() => setEditorOpen(false)}
        />
      )}

      {managerOpen && (
        <CategoryManager
          categories={categories}
          onClose={() => setManagerOpen(false)}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-safe">
            <p className="min-w-0 truncate text-[17px] font-bold text-white">
              {lightbox.title}
            </p>
            <button
              type="button"
              aria-label="关闭大图"
              onClick={() => setLightbox(null)}
              className="shrink-0 rounded-full bg-white/15 px-4 py-2 text-[17px] font-bold text-white active:scale-95"
            >
              关闭
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
            {lightbox.image_url && (
              <img
                src={lightbox.image_url}
                alt={lightbox.title}
                className="max-h-[92vh] w-auto max-w-[92vw] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PracticeItem({
  index,
  question,
  answer,
  color,
}: {
  index: number;
  question: string;
  answer: string;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <p className="text-[16px] font-bold leading-relaxed">
        {index + 1}. {question}
      </p>
      {answer &&
        (open ? (
          <>
            <p className="mt-1 whitespace-pre-line rounded-xl bg-white px-3 py-2 text-[16px] leading-relaxed">
              <span className="font-extrabold" style={{ color }}>
                答：
              </span>
              {answer}
            </p>
            <button
              type="button"
              aria-expanded={true}
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full border-[3px] border-[var(--border)] bg-white px-3 py-1 text-[15px] font-bold text-[var(--dim)] active:scale-95"
            >
              收起答案
            </button>
          </>
        ) : (
          <button
            type="button"
            aria-expanded={false}
            onClick={() => setOpen(true)}
            className="mt-1 rounded-full border-[3px] px-3 py-1 text-[15px] font-extrabold active:scale-95"
            style={{ borderColor: color, color }}
          >
            看答案
          </button>
        ))}
    </li>
  );
}

function CardItem({
  card,
  category,
  onOpenImage,
  onEdit,
  onDeleteError,
}: {
  card: Card;
  category: Category | undefined;
  onOpenImage: () => void;
  onEdit: () => void;
  onDeleteError: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const color = colorOf(category?.color ?? "orange");

  const del = useMutation({
    mutationFn: () => api.deleteCard({ id: card.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
    onError: (e) =>
      onDeleteError(e instanceof Error ? e.message : "删除失败，再试一次。"),
  });

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[var(--radius)] border-[3px] bg-white shadow-[0_2px_10px_rgba(43,33,24,0.06)] transition duration-200 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_10px_24px_rgba(43,33,24,0.14)]"
      style={{ borderColor: color }}
    >
      {card.image_url && (
        <button
          type="button"
          aria-label={`放大看图：${card.title}`}
          onClick={onOpenImage}
          className="block w-full bg-[#FBF6EC]"
        >
          <img
            src={card.image_url}
            alt={card.title}
            loading="lazy"
            className="max-h-[380px] w-full object-contain"
          />
        </button>
      )}
      <div className="flex flex-1 flex-col p-4">
        {category && (
          <span
            className="self-start rounded-full px-3 py-1 text-[14px] font-extrabold text-white"
            style={{ backgroundColor: color }}
          >
            {category.name}
          </span>
        )}
        <h2 className="mt-2 text-[22px] font-extrabold leading-snug md:text-[24px]">
          {card.title}
        </h2>
        {card.points && (
          <p className="mt-2 whitespace-pre-line text-[17px] leading-relaxed md:text-[18px]">
            {card.points}
          </p>
        )}
        {card.practice.length > 0 && (
          <div className="mt-3 rounded-2xl bg-[#FFF9F0] p-3">
            <p className="text-[16px] font-extrabold" style={{ color }}>
              练一练（先自己想，再看答案）
            </p>
            <ol className="mt-2 flex flex-col gap-3">
              {card.practice.map((item, i) => (
                <PracticeItem
                  key={i}
                  index={i}
                  question={item.q}
                  answer={item.a}
                  color={color}
                />
              ))}
            </ol>
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-4">
          {confirming ? (
            <>
              <span className="flex items-center text-[16px] font-bold text-[#B3261E]">
                真的删掉这张卡？
              </span>
              <button
                type="button"
                disabled={del.isPending}
                onClick={() => del.mutate()}
                className="rounded-full bg-[#FF5A5F] px-4 py-1.5 text-[16px] font-extrabold text-white active:scale-95 disabled:opacity-50"
              >
                {del.isPending ? "删除中…" : "删掉"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full border-[3px] border-[var(--border)] bg-white px-4 py-1.5 text-[16px] font-bold active:scale-95"
              >
                不删了
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border-[3px] px-4 py-1.5 text-[16px] font-extrabold active:scale-95"
                style={{ borderColor: color, color }}
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-full border-[3px] border-[var(--border)] bg-white px-4 py-1.5 text-[16px] font-bold text-[var(--dim)] active:scale-95"
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function CardEditor({
  card,
  categories,
  defaultCategoryId,
  onClose,
}: {
  card: Card | null;
  categories: Category[];
  defaultCategoryId?: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(card?.title ?? "");
  const [points, setPoints] = useState(card?.points ?? "");
  const [practiceText, setPracticeText] = useState(
    card
      ? card.practice
          .map((item) => (item.a ? `${item.q} 答：${item.a}` : item.q))
          .join("\n")
      : "",
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    card?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? null,
  );
  const [image, setImage] = useState<ImageState>(
    card?.image_url ? { kind: "keep" } : { kind: "none" },
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Esc closes the editor (mouse/keyboard devices).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = useMutation({
    mutationFn: async () => {
      const img =
        image.kind === "new"
          ? { dataBase64: image.dataBase64, mimeType: image.mimeType }
          : null;
      if (card) {
        return await api.updateCard({
          id: card.id,
          title: title.trim(),
          points: points.trim(),
          categoryId: categoryId as number,
          image: img,
          removeImage: image.kind === "none",
          practiceText: practiceText.trim(),
        });
      }
      return await api.addCard({
        title: title.trim(),
        points: points.trim(),
        categoryId: categoryId as number,
        image: img,
        practiceText: practiceText.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      onClose();
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "保存失败，再试一次。"),
  });

  const onPickFile = async (file: File) => {
    try {
      const { dataBase64, mimeType } = await fileToBase64(file);
      setImage({
        kind: "new",
        dataBase64,
        mimeType,
        previewUrl: URL.createObjectURL(file),
      });
      setError(null);
    } catch {
      setError("这张图片读不出来，换一张试试。");
    }
  };

  const onSave = () => {
    if (!title.trim()) {
      setError("先给卡片起个标题吧。");
      return;
    }
    if (categoryId == null) {
      setError("先选一个分类。");
      return;
    }
    setError(null);
    save.mutate();
  };

  const previewSrc =
    image.kind === "new"
      ? image.previewUrl
      : image.kind === "keep"
        ? card?.image_url
        : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={card ? "编辑卡片" : "新增卡片"}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-white p-5 pb-safe sm:rounded-[24px] md:max-w-[600px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold">
            {card ? "编辑卡片" : "新增卡片"}
          </h2>
          <button
            type="button"
            aria-label="关闭编辑"
            onClick={onClose}
            className="rounded-full bg-[#FFF3DF] px-4 py-1.5 text-[16px] font-bold active:scale-95"
          >
            关闭
          </button>
        </div>

        <label
          htmlFor="card-title"
          className="mt-4 block text-[16px] font-extrabold"
        >
          标题
        </label>
        <input
          {...FIELDS.addCard.title}
          id="card-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="比如：十字相乘法"
          className="mt-1 w-full rounded-2xl border-[3px] border-[var(--border)] px-4 py-2.5 text-[18px] outline-none focus:border-[var(--accent)]"
        />

        <span className="mt-4 block text-[16px] font-extrabold">分类</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const color = colorOf(cat.color);
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryId(cat.id)}
                className="rounded-full border-[3px] px-4 py-1.5 text-[16px] font-bold active:scale-95"
                style={
                  active
                    ? { backgroundColor: color, borderColor: color, color: "#fff" }
                    : { backgroundColor: "#fff", borderColor: color, color }
                }
              >
                {cat.name}
              </button>
            );
          })}
          {categories.length === 0 && (
            <p className="text-[16px] text-[var(--dim)]">
              还没有分类，先去「管理分类」加一个。
            </p>
          )}
        </div>

        <span className="mt-4 block text-[16px] font-extrabold">
          知识点图片
        </span>
        {previewSrc ? (
          <div className="mt-2">
            <img
              src={previewSrc}
              alt="卡片图片预览"
              className="max-h-56 w-full rounded-2xl bg-[#FBF6EC] object-contain"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full border-[3px] border-[var(--border)] px-4 py-1.5 text-[16px] font-bold active:scale-95"
              >
                换一张
              </button>
              <button
                type="button"
                onClick={() => setImage({ kind: "none" })}
                className="rounded-full border-[3px] border-[var(--border)] px-4 py-1.5 text-[16px] font-bold text-[var(--dim)] active:scale-95"
              >
                去掉图片
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 w-full rounded-2xl border-[3px] border-dashed border-[#D8C6A5] bg-[#FFF9F0] px-4 py-5 text-[17px] font-extrabold text-[var(--dim)] active:scale-[0.99]"
          >
            ＋ 添加图片（拍照或从相册选）
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="选择卡片图片"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickFile(f);
            e.target.value = "";
          }}
        />

        <label
          htmlFor="card-points"
          className="mt-4 block text-[16px] font-extrabold"
        >
          要点（方法、公式、易错点，用大白话写）
        </label>
        <textarea
          {...FIELDS.addCard.points}
          id="card-points"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          rows={6}
          placeholder="比如：找两个数，相加等于一次项系数，相乘等于常数项…"
          className="mt-1 w-full rounded-2xl border-[3px] border-[var(--border)] px-4 py-2.5 text-[17px] leading-relaxed outline-none focus:border-[var(--accent)]"
        />

        <label
          htmlFor="card-practice"
          className="mt-4 block text-[16px] font-extrabold"
        >
          练习题（可选，一行一题）
        </label>
        <textarea
          {...FIELDS.addCard.practiceText}
          id="card-practice"
          value={practiceText}
          onChange={(e) => setPracticeText(e.target.value)}
          rows={5}
          placeholder={
            "比如：计算 103² 答：(100 + 3)² = 10000 + 600 + 9 = 10609\n答案跟在题目后面，用「答：」起头就行"
          }
          className="mt-1 w-full rounded-2xl border-[3px] border-[var(--border)] px-4 py-2.5 text-[17px] leading-relaxed outline-none focus:border-[var(--accent)]"
        />
        <p className="mt-1 text-[14px] font-bold text-[var(--dim)]">
          答案会先藏起来，孩子点「看答案」才展开；留空就是没有练习。
        </p>

        {error && (
          <p role="alert" className="mt-3 text-[16px] font-bold text-[#B3261E]">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={save.isPending}
          onClick={onSave}
          className="mt-5 w-full rounded-full bg-[var(--accent)] py-3 text-[19px] font-extrabold text-white active:scale-[0.99] disabled:opacity-50"
        >
          {save.isPending ? "保存中…" : card ? "保存修改" : "保存卡片"}
        </button>
      </div>
    </div>
  );
}

function CategoryManager({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Esc closes the category manager (mouse/keyboard devices).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["library"] });
  const onErr = (e: unknown) =>
    setError(e instanceof Error ? e.message : "操作失败，再试一次。");

  const add = useMutation({
    mutationFn: () => api.addCategory({ name: newName.trim() }),
    onSuccess: () => {
      setNewName("");
      setError(null);
      invalidate();
    },
    onError: onErr,
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="管理分类"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-white p-5 pb-safe sm:rounded-[24px] md:max-w-[600px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold">管理分类</h2>
          <button
            type="button"
            aria-label="关闭分类管理"
            onClick={onClose}
            className="rounded-full bg-[#FFF3DF] px-4 py-1.5 text-[16px] font-bold active:scale-95"
          >
            关闭
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {categories.map((cat) => (
            <CategoryRow key={cat.id} category={cat} onError={onErr} />
          ))}
          {categories.length === 0 && (
            <p className="text-[16px] text-[var(--dim)]">还没有分类。</p>
          )}
        </div>

        <label
          htmlFor="new-category"
          className="mt-5 block text-[16px] font-extrabold"
        >
          新增分类
        </label>
        <div className="mt-1 flex gap-2">
          <input
            {...FIELDS.addCategory.name}
            id="new-category"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="比如：分数、概率…"
            className="min-w-0 flex-1 rounded-2xl border-[3px] border-[var(--border)] px-4 py-2.5 text-[17px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => {
              if (!newName.trim()) {
                setError("先写个分类名吧。");
                return;
              }
              setError(null);
              add.mutate();
            }}
            className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-2 text-[17px] font-extrabold text-white active:scale-95 disabled:opacity-50"
          >
            {add.isPending ? "添加中…" : "添加"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[16px] font-bold text-[#B3261E]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onError,
}: {
  category: Category;
  onError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(category.name);
  const [confirming, setConfirming] = useState(false);
  const color = colorOf(category.color);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["library"] });

  const rename = useMutation({
    mutationFn: () => api.renameCategory({ id: category.id, name: name.trim() }),
    onSuccess: invalidate,
    onError,
  });
  const del = useMutation({
    mutationFn: () => api.deleteCategory({ id: category.id }),
    onSuccess: invalidate,
    onError,
  });

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="h-5 w-5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <label className="sr-only" htmlFor={`cat-name-${category.id}`}>
        分类名：{category.name}
      </label>
      <input
        {...FIELDS.renameCategory.name}
        id={`cat-name-${category.id}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-0 flex-1 rounded-2xl border-[3px] border-[var(--border)] px-3 py-2 text-[17px] font-bold outline-none focus:border-[var(--accent)]"
      />
      <span className="shrink-0 text-[14px] font-bold text-[var(--dim)]">
        {category.card_count} 张
      </span>
      {confirming ? (
        <>
          <button
            type="button"
            disabled={del.isPending}
            onClick={() => del.mutate()}
            className="shrink-0 rounded-full bg-[#FF5A5F] px-3 py-1.5 text-[15px] font-extrabold text-white active:scale-95 disabled:opacity-50"
          >
            {del.isPending ? "删除中…" : "确认删"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="shrink-0 rounded-full border-[3px] border-[var(--border)] px-3 py-1.5 text-[15px] font-bold active:scale-95"
          >
            取消
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={
              rename.isPending || !name.trim() || name.trim() === category.name
            }
            onClick={() => rename.mutate()}
            className="shrink-0 rounded-full border-[3px] px-3 py-1.5 text-[15px] font-extrabold active:scale-95 disabled:opacity-40"
            style={{ borderColor: color, color }}
          >
            {rename.isPending ? "改名中…" : "改名"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-full border-[3px] border-[var(--border)] px-3 py-1.5 text-[15px] font-bold text-[var(--dim)] active:scale-95"
          >
            删除
          </button>
        </>
      )}
    </div>
  );
}
