import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  Download,
  ExternalLink,
  FileArchive,
  FolderOpen,
  GitBranch,
  Menu,
  MessageSquareText,
  Moon,
  Network,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Tags,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  assetUrl,
  filterApps,
  formatBytes,
  loadCatalog,
  parseRoute,
  type AppCatalog,
  type AppCatalogEntry,
  type CatalogFilters,
} from "./catalog";

const githubRepo = "https://github.com/LarchLiu/sessio-web";
const githubReleases = "https://github.com/LarchLiu/sessio/releases/latest";
const defaultFilters: CatalogFilters = { query: "", category: "all", topic: "", permission: "all" };

export default function App() {
  const [route, setRoute] = useState(() => parseRoute());
  const [catalog, setCatalog] = useState<AppCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultFilters);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("sessio-site-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const updateRoute = () => setRoute(parseRoute());
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("sessio-site-theme", theme);
  }, [theme]);

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((error: unknown) => setCatalogError(String(error)));
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <Header route={route} onNavigate={navigate} theme={theme} onThemeChange={setTheme} />
      {route.page === "home" ? (
        <Home catalog={catalog} onNavigate={navigate} />
      ) : route.page === "apps" ? (
        <AppsCatalog catalog={catalog} error={catalogError} onNavigate={navigate} filters={catalogFilters} onFiltersChange={setCatalogFilters} />
      ) : (
        <AppDetail catalog={catalog} slug={route.slug ?? ""} error={catalogError} onNavigate={navigate} />
      )}
      <Footer onNavigate={navigate} />
    </div>
  );
}

function Header({
  route,
  onNavigate,
  theme,
  onThemeChange,
}: {
  route: ReturnType<typeof parseRoute>;
  onNavigate: (path: string) => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (path: string) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="site-header">
      <div className="announcement"><span>SESSIO / LOCAL-FIRST AGENT WORKBENCH</span><span>OPEN SOURCE DESKTOP APP <ArrowRight size={12} /></span></div>
      <div className="header-inner">
        <button className="brand-button" onClick={() => go("/")} aria-label="返回 Sessio 首页">
          <img src={assetUrl("brand/logo.png")} alt="" />
          <span>Sessio</span>
        </button>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="主导航">
          <button className={route.page === "home" ? "nav-link active" : "nav-link"} onClick={() => go("/")}>产品</button>
          <button className={route.page !== "home" ? "nav-link active" : "nav-link"} onClick={() => go("/apps")}>应用商店</button>
          <a className="nav-link" href={`${githubRepo}#readme`} target="_blank" rel="noreferrer">开源 <ExternalLink size={12} /></a>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a className="button button-small button-dark desktop-only" href={githubReleases} target="_blank" rel="noreferrer">
            <Download size={14} /> 下载桌面端
          </a>
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Home({ catalog, onNavigate }: { catalog: AppCatalog | null; onNavigate: (path: string) => void }) {
  const apps = catalog?.apps ?? [];
  return (
    <main>
      <section className="hero-band">
        <div className="section-wrap hero-inner">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> LOCAL-FIRST AGENT WORKBENCH</div>
            <h1>让上下文<br /><em>留在你的工作台。</em></h1>
            <p className="hero-lede">Sessio 把 Agent 会话、项目文件和可运行的应用放到同一张桌面上。少一点切换，多一点真正的进展。</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => onNavigate("/apps")}><Boxes size={16} /> 浏览应用商店 <ArrowRight size={15} /></button>
              <a className="button button-outline-light" href={githubReleases} target="_blank" rel="noreferrer"><Download size={15} /> 获取 Sessio</a>
            </div>
            <div className="hero-trust"><span><ShieldCheck size={14} /> 本地优先</span><span><Code2 size={14} /> 开源</span><span><Zap size={14} /> 多 Agent 协作</span></div>
          </div>
          <div className="hero-product">
            <div className="product-overline"><span>LIVE FROM SESSIO</span><span>01 / 04</span></div>
            <div className="product-frame">
              <div className="product-frame-bar"><span className="window-dots"><i /><i /><i /></span><span>Sessio / app workspace</span><span className="live-state"><i /> running</span></div>
              <img src={assetUrl("brand/sessio-workspace.png")} alt="Sessio 中运行的应用工作台" />
            </div>
            <div className="product-caption"><span>Applications live inside the workbench.</span><ArrowDownRight size={17} /></div>
          </div>
        </div>
        <div className="hero-footer section-wrap"><span>会话 / 项目 / 应用 / 记忆</span><span>SCROLL TO EXPLORE <ArrowDownRight size={14} /></span></div>
      </section>

      <section className="metric-strip">
        <div className="section-wrap metric-grid">
          <Metric value="01" label="一张桌面" text="把工作上下文放在同一处" />
          <Metric value="∞" label="可扩展" text="从会话延伸到应用生态" />
          <Metric value="100%" label="本地优先" text="数据和工作流由你掌握" />
          <Metric value={String(apps.length).padStart(2, "0")} label="当前应用" text="下载后即可放进 Sessio" />
        </div>
      </section>

      <section className="section-wrap manifesto-section">
        <div className="section-index">01 <span>/</span> THE WORKBENCH</div>
        <div className="manifesto-copy"><h2>复杂工作需要<br /><em>清晰的容器。</em></h2><p>Agent 不应该漂浮在项目之外。Sessio 让每个会话拥有项目、文件、工具和记忆，随时可以继续。</p></div>
        <div className="manifesto-aside"><span className="aside-line" /><strong>从一次对话<br />到一整个工作循环。</strong><span>Context stays close to the work.</span></div>
      </section>

      <section className="section-wrap capabilities-section">
        <div className="section-heading-row"><div><div className="section-kicker">WHAT LIVES HERE</div><h2>一个工作台，<br /><em>四种推进方式。</em></h2></div><p>你可以从聊天开始，也可以从一个项目、一个自动任务或一个应用开始。它们最后都会回到同一份上下文。</p></div>
        <div className="capability-list">
          <Capability number="01" icon={<MessageSquareText />} title="实时 Agent 会话" text="在同一条工作线上查看回答、工具调用和权限请求。" tag="CHAT" />
          <Capability number="02" icon={<Users />} title="多智能体协作" text="把任务拆成清晰的工作单元，让不同 Agent 各自推进。" tag="THREADS" />
          <Capability number="03" icon={<Network />} title="项目与记忆" text="文件、会话历史和 memory 保持在本地，恢复工作不必重新解释。" tag="CONTEXT" />
          <Capability number="04" icon={<Sparkles />} title="可运行的应用" text="把离线 HTML 工具、数据页面和小游戏装进你的桌面工作台。" tag="APPS" />
        </div>
      </section>

      <section className="story-band"><div className="section-wrap story-grid"><div className="section-index inverse">02 <span>/</span> MADE FOR THE LOOP</div><div className="story-copy"><div className="section-kicker light">FROM YOUR ORIGINAL WORKFLOW</div><h2>聊天、线程、<br /><em>工具和 Channels。</em></h2><p>通过 ACP 聚合 Codex、Claude Code、OpenCode 与 Pi 的本地对话。需要时，继续使用 Computer Use、Screenshot、Skills 和 MCP。</p><div className="story-tags"><span>Codex</span><span>Claude Code</span><span>OpenCode</span><span>Pi</span><span>MCP</span></div></div><ChatPreview /></div></section>

      <section className="store-band">
        <div className="section-wrap store-shelf">
          <div className="store-shelf-header"><div><div className="section-kicker">SESSIO APPS</div><h2>给工作台<br /><em>添一个新窗口。</em></h2></div><div className="store-shelf-action"><span>离线运行 / 结构清晰 / 下载即用</span><button className="text-link" onClick={() => onNavigate("/apps")}>查看全部应用 <ArrowRight size={14} /></button></div></div>
          <div className="featured-app-row">{apps.slice(0, 3).map((app) => <AppCard key={app.slug} app={app} onNavigate={onNavigate} />)}{!catalog && <CatalogLoading />}</div>
        </div>
      </section>

      <section className="download-band"><div className="section-wrap download-inner"><div><div className="section-kicker light">START LOCAL</div><h2>把下一步<br /><em>留在你手上。</em></h2><p>下载 Sessio，打开一个属于你的 Agent 工作台。</p></div><a className="button button-light" href={githubReleases} target="_blank" rel="noreferrer">下载桌面端 <ArrowDownToLine size={15} /></a></div></section>
    </main>
  );
}

function Metric({ value, label, text }: { value: string; label: string; text: string }) {
  return <div className="metric"><strong>{value}</strong><div><span>{label}</span><small>{text}</small></div></div>;
}

function Capability({ number, icon, title, text, tag }: { number: string; icon: React.ReactNode; title: string; text: string; tag: string }) {
  return <article className="capability"><div className="capability-index">{number}</div><div className="capability-icon">{icon}</div><div className="capability-content"><h3>{title}</h3><p>{text}</p></div><span className="capability-tag">{tag}</span><ArrowRight className="capability-arrow" size={18} /></article>;
}

function ChatPreview() {
  return <div className="chat-preview"><div className="chat-preview-bar"><span><i /> CHAT · PROJECT</span><span>context / ready</span></div><div className="chat-preview-head"><strong>Keep the whole loop together.</strong><span>Project Chat</span></div><div className="chat-preview-message user-message">帮我拆解这个项目的下一步。</div><div className="chat-preview-message"><span className="preview-avatar">S</span><div><b>Session ready</b><small>已读取项目上下文，正在准备 3 个工作单元。</small></div></div><div className="chat-preview-message muted-message"><span className="preview-avatar blue-avatar">A</span><div><b>Planning with agents</b><small>Codex · Claude Code · OpenCode</small></div></div><div className="chat-preview-composer"><span>Ask, search or chat...</span><MessageSquareText size={14} /></div><span className="chat-preview-caption">PROJECT CHAT / LOCAL CONTEXT</span></div>;
}

function AppsCatalog({ catalog, error, onNavigate, filters, onFiltersChange }: {
  catalog: AppCatalog | null;
  error: string | null;
  onNavigate: (path: string) => void;
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
}) {
  const categories = useMemo(() => [...new Set(catalog?.apps.map((app) => app.category) ?? [])].sort(), [catalog]);
  const topics = useMemo(() => [...new Set(catalog?.apps.flatMap((app) => app.topics) ?? [])].sort((a, b) => a.localeCompare(b, "zh-CN")), [catalog]);
  const permissions = useMemo(() => [...new Set(catalog?.apps.flatMap((app) => app.permissions) ?? [])].sort(), [catalog]);
  const apps = catalog ? filterApps(catalog.apps, filters) : [];
  const hasFilters = filters.query !== "" || filters.category !== "all" || filters.topic !== "" || filters.permission !== "all";

  return (
    <main className="store-page">
      <section className="store-page-hero">
        <div className="section-wrap store-page-hero-inner">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> SESSIO APPS</div><h1>应用商店</h1></div>
          <div className="store-count"><strong>{catalog?.apps.length ?? "—"}</strong><span>AVAILABLE APPS</span></div>
        </div>
      </section>
      <section className="section-wrap catalog-section" aria-label="应用目录">
        <div className="catalog-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input type="search" value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} placeholder="搜索应用、分类或 Topics" aria-label="搜索应用、作者、分类或 Topics" />
          </label>
          <label className="select-field"><span>分类</span><select aria-label="分类" value={filters.category} onChange={(event) => onFiltersChange({ ...filters, category: event.target.value as CatalogFilters["category"] })}><option value="all">全部</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
          <label className="select-field"><span>Topic</span><select aria-label="Topic" value={filters.topic} onChange={(event) => onFiltersChange({ ...filters, topic: event.target.value })}><option value="">全部</option>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
          <label className="select-field"><span>权限</span><select aria-label="权限" value={filters.permission} onChange={(event) => onFiltersChange({ ...filters, permission: event.target.value })}><option value="all">全部</option>{permissions.map((item) => <option key={item} value={item}>{permissionLabel(item)}</option>)}</select><ChevronDown size={14} /></label>
          <button className="icon-button catalog-reset" onClick={() => onFiltersChange(defaultFilters)} disabled={!hasFilters} title="清除搜索和筛选" aria-label="清除搜索和筛选"><RotateCcw size={16} /></button>
        </div>
        <div className="catalog-results"><span className="result-count" role="status" aria-live="polite">{catalog ? `${apps.length} / ${catalog.apps.length} 个应用` : "加载中"}</span></div>
        {error ? <CatalogError message={error} /> : !catalog ? <CatalogLoading /> : apps.length ? (
          <div className="catalog-grid">{apps.map((app) => <AppCard key={app.slug} app={app} onNavigate={onNavigate} />)}</div>
        ) : (
          <div className="empty-state"><Search size={23} /><strong>没有匹配的应用</strong>{hasFilters && <button className="text-link" onClick={() => onFiltersChange(defaultFilters)}><RotateCcw size={14} /> 清除搜索和筛选</button>}</div>
        )}
      </section>
    </main>
  );
}

function AppCard({ app, onNavigate }: { app: AppCatalogEntry; onNavigate: (path: string) => void }) {
  return (
    <article className="app-card">
      <button className="app-card-main" onClick={() => onNavigate(`/apps/${app.slug}`)}>
        <div className="app-cover">{app.screenshots[0] ? <img src={assetUrl(app.screenshots[0])} alt={`${app.nameZh} 截图`} /> : <AppCoverMark slug={app.slug} />}<span className="cover-label">{app.slug}</span></div>
        <div className="app-card-content">
          <div className="app-card-title"><div className="app-logo">{app.logoUrl ? <img src={assetUrl(app.logoUrl)} alt="" /> : <AppInitials name={app.nameZh} />}</div><div><h3>{app.nameZh}</h3><span>{app.nameEn}</span></div></div>
          <p>{app.description}</p>
          <div className="app-taxonomy"><span className="app-category"><Boxes size={13} />{app.category}</span><TopicList topics={app.topics} /></div>
          <div className="app-card-meta"><span>v{app.version}</span><span>{app.author}</span><span>{formatBytes(app.packageSize)}</span></div>
        </div>
      </button>
      <div className="app-card-footer"><button className="text-link" onClick={() => onNavigate(`/apps/${app.slug}`)}>查看详情 <ArrowRight size={14} /></button><a className="icon-button" href={app.downloadUrl} title={`下载 ${app.nameZh}`} aria-label={`下载 ${app.nameZh}`}><Download size={15} /></a></div>
    </article>
  );
}

function TopicList({ topics }: { topics: string[] }) {
  if (!topics.length) return null;
  return <div className="topic-list" aria-label="Topics"><Tags size={13} aria-hidden="true" />{topics.map((topic) => <span key={topic}>{topic}</span>)}</div>;
}

function AppDetail({ catalog, slug, error, onNavigate }: { catalog: AppCatalog | null; slug: string; error: string | null; onNavigate: (path: string) => void }) {
  const app = catalog?.apps.find((item) => item.slug === slug);
  if (error) return <main><section className="section-wrap detail-error"><CatalogError message={error} /></section></main>;
  if (!catalog) return <main><section className="section-wrap"><CatalogLoading /></section></main>;
  if (!app) return <main><section className="section-wrap detail-error"><CircleAlert size={25} /><h1>找不到这个应用</h1><button className="text-link" onClick={() => onNavigate("/apps")}><ArrowLeft size={14} /> 返回应用商店</button></section></main>;

  return (
    <main className="detail-page">
      <section className="section-wrap detail-header">
        <button className="back-link" onClick={() => onNavigate("/apps")}><ArrowLeft size={14} /> 应用商店</button>
        <div className="detail-title-row">
          <div className="detail-logo">{app.logoUrl ? <img src={assetUrl(app.logoUrl)} alt="" /> : <AppInitials name={app.nameZh} />}</div>
          <div><div className="eyebrow"><span className="eyebrow-dot" /> SESSIO APP / {app.slug}</div><h1>{app.nameZh}</h1><p className="detail-english">{app.nameEn} <span>·</span> v{app.version}</p></div>
          <a className="button button-primary detail-download" href={app.downloadUrl}><Download size={16} /> 下载 ZIP</a>
        </div>
        <div className="detail-taxonomy"><span className="app-category"><Boxes size={13} />{app.category}</span><TopicList topics={app.topics} /></div>
      </section>
      <section className="section-wrap detail-layout">
        <div className="detail-main"><ScreenshotCarousel app={app} /><div className="detail-description"><div className="section-kicker">ABOUT THIS APP</div><h2>{app.description}</h2><p>这是一个可以在 Sessio 中离线运行的独立 App。页面、数据和说明都封装在下载包中，不需要额外的服务端或账号。</p></div></div>
        <aside className="detail-sidebar">
          <InfoRow label="分类" value={app.category} />
          <InfoRow label="作者" value={app.author} />
          <InfoRow label="版本" value={app.version} />
          <InfoRow label="下载包" value={formatBytes(app.packageSize)} />
          <InfoRow label="文件数量" value={`${app.fileCount} 个文件`} />
          <div className="sidebar-block"><div className="section-kicker">PERMISSIONS</div><div className="permission-list">{app.permissions.length ? app.permissions.map((item) => <span key={item}><ShieldCheck size={12} /> {permissionLabel(item)}</span>) : <span><Check size={12} /> 无额外权限</span>}</div></div>
          <div className="sidebar-block"><div className="section-kicker">PACKAGE</div><code>{app.assetName}</code><a className="text-link" href={app.downloadUrl}>GitHub Release <ExternalLink size={13} /></a></div>
        </aside>
      </section>
      <section className="section-wrap install-section"><div><div className="section-kicker">INSTALL IN SESSIO</div><h2>三步开始运行。</h2><p>应用不会改变你的项目结构，解压后由 Sessio 扫描并打开。</p></div><div className="install-steps"><InstallStep number="01" icon={<Download />} title="下载 ZIP" text="获取当前版本的完整 App 压缩包。" /><InstallStep number="02" icon={<FileArchive />} title="解压到 apps" text={`将 ${app.slug} 文件夹放入 $SESSIO_APP_HOME/apps/。`} /><InstallStep number="03" icon={<FolderOpen />} title="打开 Sessio" text="刷新应用列表，在侧边栏中启动它。" /></div></section>
      <section className="section-wrap file-section"><div className="section-kicker">PACKAGE CONTENTS</div><h2>下载包内的文件。</h2><div className="file-list">{app.files.slice(0, 30).map((file) => <span key={file}><Code2 size={12} /> {file}</span>)}{app.files.length > 30 && <span className="file-more">还有 {app.files.length - 30} 个文件</span>}</div></section>
    </main>
  );
}

function ScreenshotCarousel({ app }: { app: AppCatalogEntry }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenshotCount = app.screenshots.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [app.slug]);

  useEffect(() => {
    if (screenshotCount < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % screenshotCount);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [app.slug, screenshotCount]);

  if (!screenshotCount) {
    return <div className="empty-screenshot"><AppCoverMark slug={app.slug} /><span>暂无截图</span></div>;
  }

  const showPrevious = () => setActiveIndex((current) => (current - 1 + screenshotCount) % screenshotCount);
  const showNext = () => setActiveIndex((current) => (current + 1) % screenshotCount);
  return <div className="screenshot-carousel"><img src={assetUrl(app.screenshots[activeIndex])} alt={`${app.nameZh} 应用截图 ${activeIndex + 1}`} /><div className="carousel-controls"><button className="icon-button" onClick={showPrevious} aria-label="上一张截图" title="上一张截图"><ArrowLeft size={15} /></button><div className="carousel-dots">{app.screenshots.map((screenshot, index) => <button key={screenshot} className={index === activeIndex ? "carousel-dot active" : "carousel-dot"} onClick={() => setActiveIndex(index)} aria-label={`查看第 ${index + 1} 张截图`} aria-current={index === activeIndex ? "true" : undefined} />)}</div><button className="icon-button" onClick={showNext} aria-label="下一张截图" title="下一张截图"><ArrowRight size={15} /></button><span className="carousel-counter">{String(activeIndex + 1).padStart(2, "0")} / {String(screenshotCount).padStart(2, "0")}</span></div></div>;
}

function InfoRow({ label, value }: { label: string; value: string }) { return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>; }
function InstallStep({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) { return <article className="install-step"><div className="step-top"><span>{number}</span><span className="feature-icon">{icon}</span></div><h3>{title}</h3><p>{text}</p></article>; }
function AppInitials({ name }: { name: string }) { return <span className="app-initials">{name.slice(0, 1)}</span>; }
function AppCoverMark({ slug }: { slug: string }) { return <div className={`app-cover-mark mark-${slug}`}><span>{slug.slice(0, 2).toUpperCase()}</span><i /></div>; }
function CatalogLoading() { return <div className="catalog-loading"><span /><span /><span /></div>; }
function CatalogError({ message }: { message: string }) { return <div className="catalog-error"><CircleAlert size={21} /><div><strong>应用目录暂时不可用</strong><span>{message}</span></div></div>; }
function permissionLabel(permission: string) { const labels: Record<string, string> = { autoplay: "自动播放", clipboardWrite: "写入剪贴板", downloads: "文件下载", fullscreen: "全屏", gamepad: "游戏手柄", modals: "弹窗", pointerLock: "鼠标锁定", popups: "打开窗口" }; return labels[permission] ?? permission; }

function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <footer className="site-footer"><div className="section-wrap footer-inner"><div className="footer-brand"><img src={assetUrl("brand/logo.png")} alt="" /><div><strong>Sessio</strong><span>Agent workbench for real work.</span></div></div><div className="footer-links"><button onClick={() => onNavigate("/apps")}>应用商店</button><a href={githubRepo} target="_blank" rel="noreferrer"><GitBranch size={14} /> GitHub</a><a href={`${githubRepo}/issues`} target="_blank" rel="noreferrer">反馈问题</a></div><span className="footer-copy">© 2026 Sessio</span></div></footer>;
}
