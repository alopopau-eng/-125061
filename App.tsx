
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "./lib/firebase";
import {
  UsersIcon,
  CardIcon,
  KeyIcon,
  BellIcon,
  SearchIcon,
  SparklesIcon,
  CopyIcon,
  PhoneIcon,
} from "./components/Icons";
import { DashboardStats, FilterType, VisitorDoc } from "./types";
import { generateVisitorInsights } from "./services/geminiService";

const App: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  // Firestore Real-time Listener - FIXED: Added check for db
  useEffect(() => {
    if (!db) return;

    try {
      const visitorsRef = collection(db, "pays");
      const q = query(visitorsRef, orderBy("updatedAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const visitorsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as VisitorDoc[];

          setVisitors(visitorsData);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore Error:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Query Initialization Error:", err);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`تم نسخ ${label} بنجاح`);
  };

  const stats = useMemo<DashboardStats>(
    () => ({
      total: visitors.length,
      online: visitors.filter((v) => v.online).length,
      withCard: visitors.filter((v) => v.number).length,
      unread: visitors.filter((v) => v.isUnread).length,
    }),
    [visitors]
  );

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const q = searchQuery.toLowerCase();
      const name = `${v.firstName || ""} ${v.lastName || ""}`.toLowerCase();
      const matchesSearch = [name, v.email, v.phone, v.id].some((f) =>
        f?.includes(q)
      );
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && v.isUnread) ||
        (activeFilter === "withCard" && v.number) ||
        (activeFilter === "withOtp" && v.lastOtp) ||
        (activeFilter === "online" && v.online);
      return matchesSearch && matchesFilter;
    });
  }, [visitors, searchQuery, activeFilter]);

  const handleGenerateInsights = async () => {
    if (visitors.length === 0) {
      showToast("لا يوجد زوار لتحليل بياناتهم", "info");
      return;
    }
    setIsAiLoading(true);
    try {
      const insight = await generateVisitorInsights(visitors);
      setAiInsight(insight);
    } catch (err) {
      showToast("فشل توليد التحليل", "info");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const visitorRef = doc(db, "pays", id);
      await updateDoc(visitorRef, { isUnread: false });
      showToast("تم التحديث بنجاح");
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row antialiased font-['Noto_Sans_Arabic']" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-indigo-600 text-white border-indigo-500"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <BellIcon />
            )}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-l border-slate-200 sticky top-0 h-screen z-40">
        <div className="p-8">
          <div className="flex items-center gap-3.5 group cursor-default">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-right">
              <h1 className="font-black text-xl text-slate-900 tracking-tight leading-none">
                VISITOR HUB
              </h1>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                AI Powered Sync
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 custom-scroll overflow-y-auto">
          <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
            القائمة الرئيسية
          </p>
          <SidebarItem
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            icon={<UsersIcon />}
            label="جميع الزوار"
          />
          <SidebarItem
            active={activeFilter === "online"}
            onClick={() => setActiveFilter("online")}
            icon={
              <div className={`w-2.5 h-2.5 bg-emerald-500 rounded-full ${activeFilter === "online" ? "status-ripple" : ""}`} />
            }
            label="المتصلون الآن"
          />
          <SidebarItem
            active={activeFilter === "unread"}
            onClick={() => setActiveFilter("unread")}
            icon={<BellIcon />}
            label="تنبيهات غير مقروءة"
            count={stats.unread}
          />
          <p className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
            التصنيفات
          </p>
          <SidebarItem
            active={activeFilter === "withCard"}
            onClick={() => setActiveFilter("withCard")}
            icon={<CardIcon />}
            label="بيانات الدفع"
          />
          <SidebarItem
            active={activeFilter === "withOtp"}
            onClick={() => setActiveFilter("withOtp")}
            icon={<KeyIcon />}
            label="رموز التحقق"
          />
        </nav>

        <div className="p-6">
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 relative overflow-hidden group">
            <div className="relative z-10 text-right">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <SparklesIcon />
                <span className="font-bold text-sm">مساعد Gemini</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
                تحليل فوري لحالة الزوار وسلوكهم الشرائي عبر Gemini AI.
              </p>
              <button
                onClick={handleGenerateInsights}
                disabled={isAiLoading || visitors.length === 0}
                className="w-full py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isAiLoading ? "جاري التحليل..." : "توليد ملخص ذكي"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 glass-nav flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="ابحث عن رقم هاتف، بريد، أو اسم..."
                className="w-full pr-12 pl-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-right"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-5 ml-8">
            <div className="h-10 w-px bg-slate-200 hidden lg:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800">مشرف النظام</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                  Live Monitor
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden p-1">
                <img
                  src={`https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff`}
                  className="w-full h-full rounded-xl object-cover"
                  alt="Admin"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* AI Banner */}
          {aiInsight && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
                  <SparklesIcon />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-black text-xl mb-2 text-indigo-300">
                    تحليل المساعد الذكي (Gemini)
                  </h3>
                  <div className="text-indigo-50/90 text-sm leading-relaxed font-medium whitespace-pre-line">
                    {aiInsight}
                  </div>
                </div>
                <button
                  onClick={() => setAiInsight(null)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition backdrop-blur-sm border border-white/10"
                >
                  إغلاق التقرير
                </button>
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="إجمالي الزوار"
              value={stats.total}
              icon={<UsersIcon />}
              color="text-indigo-600"
              bg="bg-indigo-50"
              trend="تحديث فوري"
            />
            <StatCard
              label="المتصلون الآن"
              value={stats.online}
              icon={<div className="w-3 h-3 rounded-full bg-emerald-500 status-ripple" />}
              color="text-emerald-600"
              bg="bg-emerald-50"
              trend="مباشر"
            />
            <StatCard
              label="بطاقات دفع"
              value={stats.withCard}
              icon={<CardIcon />}
              color="text-rose-600"
              bg="bg-rose-50"
              trend="تحويل نشط"
            />
            <StatCard
              label="تنبيهات جديدة"
              value={stats.unread}
              icon={<BellIcon />}
              color="text-amber-600"
              bg="bg-amber-50"
              trend="بحاجة لمراجعة"
            />
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                  جاري جلب البيانات من Firestore...
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/50">
                  <h2 className="font-black text-lg text-slate-800">
                    قائمة الزوار الأخيرة
                  </h2>
                  <span className="text-[10px] font-black py-1 px-3 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                    مزامنة حية نشطة
                  </span>
                </div>
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                      <th className="px-8 py-4">الزائر</th>
                      <th className="px-6 py-4">الاتصال</th>
                      <th className="px-6 py-4">الحالة المباشرة</th>
                      <th className="px-6 py-4">الموقع</th>
                      <th className="px-8 py-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredVisitors.map((visitor) => (
                      <VisitorRow
                        key={visitor.id}
                        visitor={visitor}
                        selected={selectedId === visitor.id}
                        onToggle={() => setSelectedId(selectedId === visitor.id ? null : visitor.id)}
                        onCopy={copyToClipboard}
                        onRead={handleToggleRead}
                      />
                    ))}
                    {filteredVisitors.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest">
                            لا توجد بيانات متاحة حالياً
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const VisitorRow: React.FC<{
  visitor: VisitorDoc;
  selected: boolean;
  onToggle: () => void;
  onCopy: (text: string, label: string) => void;
  onRead: (id: string, e: React.MouseEvent) => void;
}> = ({ visitor, selected, onToggle, onCopy, onRead }) => (
  <>
    <tr
      className={`group cursor-pointer transition-all duration-300 ${
        selected ? "bg-indigo-50/40" : "hover:bg-slate-50/80"
      } ${visitor.isUnread ? "bg-amber-50/30" : ""}`}
      onClick={onToggle}
    >
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-sm shadow-sm">
              {visitor.firstName?.[0] || visitor.id[0]}
              {visitor.lastName?.[0] || ""}
            </div>
            {visitor.online && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full"></span>
            )}
          </div>
          <div className="text-right">
            <p className="font-black text-slate-900 text-sm flex items-center gap-2">
              {visitor.firstName} {visitor.lastName}
              {visitor.isUnread && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase">
                  جديد
                </span>
              )}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              ID: {visitor.id}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <p className="text-xs font-bold text-slate-700 font-mono tracking-wider" dir="ltr">
          {visitor.phone}
        </p>
        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
          {visitor.email}
        </p>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex flex-col gap-1 items-end">
          <span
            className={`text-[10px] font-black w-fit px-2 py-0.5 rounded-full uppercase ${
              visitor.online
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {visitor.online ? "متصل" : "أوفلاين"}
          </span>
          <span className="text-[10px] font-bold text-indigo-500">
            {visitor.currentPage || "الرئيسية"}
          </span>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <p className="text-xs font-black text-slate-800">
          {visitor.city || "غير محدد"}
        </p>
        <p className="text-[10px] text-slate-400 font-bold">{visitor.area}</p>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(visitor.phone || "", "رقم الهاتف");
            }}
            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition shadow-sm"
          >
            <CopyIcon />
          </button>
          <button
            onClick={(e) => onRead(visitor.id, e)}
            className={`p-2 rounded-xl transition-all shadow-sm ${
              visitor.isUnread
                ? "bg-amber-100 text-amber-600 border border-amber-200"
                : "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
            }`}
            disabled={!visitor.isUnread}
          >
            <BellIcon />
          </button>
        </div>
      </td>
    </tr>
    {selected && (
      <tr className="bg-indigo-50/20 animate-in slide-in-from-top-2 duration-300">
        <td colSpan={5} className="px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DetailSection title="بيانات البطاقة" icon={<CardIcon />} color="indigo">
              {visitor.number ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono tracking-[0.2em] text-center border-b-2 border-slate-700">
                    {visitor.number}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 text-right">
                      <p className="text-[10px] text-slate-400 font-black mb-0.5 uppercase">
                        تاريخ الانتهاء
                      </p>
                      <p className="font-bold text-slate-800">{visitor.expiry}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 text-right">
                      <p className="text-[10px] text-slate-400 font-black mb-0.5 uppercase">
                        CVV
                      </p>
                      <p className="font-bold text-slate-800">{visitor.cvv}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyBox label="لا توجد بيانات دفع" />
              )}
            </DetailSection>

            <DetailSection title="رموز التحقق" icon={<KeyIcon />} color="amber">
              {visitor.lastOtp ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-black mb-2 uppercase">
                      الرمز الحالي
                    </p>
                    <span className="text-3xl font-black text-slate-900 tracking-widest bg-amber-50 px-6 py-2 rounded-2xl border border-amber-100 block">
                      {visitor.lastOtp}
                    </span>
                  </div>
                  {visitor.otpAttempts && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {visitor.otpAttempts.map((o, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white text-slate-500 font-bold text-[10px] rounded-lg border border-slate-100"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyBox label="بانتظار رمز التحقق" />
              )}
            </DetailSection>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between text-right">
              <div>
                <h4 className="font-black text-sm text-slate-700 mb-6 uppercase tracking-wider flex items-center gap-2 justify-end">
                  تواصل سريع <PhoneIcon />
                </h4>
                <div className="space-y-4">
                  <a
                    href={`tel:${visitor.phone}`}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50"
                  >
                    <PhoneIcon /> اتصـال هاتفي
                  </a>
                  <a
                    href={`https://wa.me/${visitor.phone?.replace("+", "").replace(/\s/g, "")}`}
                    target="_blank"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-50"
                  >
                    واتساب مباشر
                  </a>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">
                  الموقع الجغرافي
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {visitor.fullAddress || visitor.city || "غير متوفر"}
                </p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )}
  </>
);

const DetailSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}> = ({ title, icon, color, children }) => (
  <div className={`bg-white p-6 rounded-[2rem] border border-${color}-100 shadow-sm relative overflow-hidden text-right`}>
    <div className={`flex items-center gap-2 text-${color}-600 mb-6 justify-end`}>
      <h4 className="font-black text-sm uppercase tracking-wider">{title}</h4>
      {icon}
    </div>
    {children}
  </div>
);

const SidebarItem: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between py-3.5 px-5 rounded-2xl transition-all duration-300 ${
      active
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <div className="flex items-center gap-4">
      <span className={`${active ? "text-white" : "text-slate-400"} transition-colors`}>
        {icon}
      </span>
      <span className="text-sm font-black tracking-tight">{label}</span>
    </div>
    {count !== undefined && count > 0 && (
      <span
        className={`${active ? "bg-indigo-400/30" : "bg-rose-500"} text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px]`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend: string;
}> = ({ label, value, icon, color, bg, trend }) => (
  <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col gap-4 text-right">
    <div className="flex items-center justify-between">
      <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
        {icon}
      </div>
      <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tighter">
        {trend}
      </div>
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const EmptyBox: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-8 flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-3xl">
    <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
  </div>
);

export default App;
