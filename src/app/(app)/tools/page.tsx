const TOOL_CATEGORIES = [
  {
    name: "学习辅助",
    icon: "📚",
    tools: [
      {
        name: "学而思随时问",
        desc: "引导式解题，不直接给答案",
        url: "https://www.xueersi.com",
        icon: "🧮",
      },
      {
        name: "百度AI精准练",
        desc: "全学段全学科，完全免费",
        url: "https://easylearn.baidu.com",
        icon: "🎯",
      },
      {
        name: "NotebookLM",
        desc: "上传资料后精准问答",
        url: "https://notebooklm.google.com",
        icon: "📓",
      },
    ],
  },
  {
    name: "英语学习",
    icon: "🔤",
    tools: [
      {
        name: "英语趣配音",
        desc: "对接中高考口语评分系统",
        url: "https://www.qupeiyin.cn",
        icon: "🎙️",
      },
    ],
  },
  {
    name: "写作工具",
    icon: "✍️",
    tools: [
      {
        name: "光速写作",
        desc: "作业帮团队，专为学生打造",
        url: "https://guangsu.com",
        icon: "📝",
      },
    ],
  },
  {
    name: "AI 创作",
    icon: "🎨",
    tools: [
      {
        name: "即梦AI",
        desc: "免费AI绘画，手机可用",
        url: "https://jimeng.jianying.com",
        icon: "🖼️",
      },
      {
        name: "可灵AI",
        desc: "国内免费AI视频生成",
        url: "https://klingai.kuaishou.com",
        icon: "🎬",
      },
      {
        name: "Suno",
        desc: "输入歌词生成完整歌曲",
        url: "https://suno.com",
        icon: "🎵",
      },
    ],
  },
  {
    name: "编程学习",
    icon: "💻",
    tools: [
      {
        name: "Scratch",
        desc: "MIT出品，拖拽式编程入门",
        url: "https://scratch.mit.edu",
        icon: "🧩",
      },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-6">
      <header className="mb-4">
        <h1 className="text-lg font-bold">🧰 精选工具导航</h1>
        <p className="text-xs text-muted-foreground">
          为你精选的学习和创作工具
        </p>
      </header>

      <div className="space-y-6">
        {TOOL_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <span>{category.icon}</span>
              {category.name}
            </h2>
            <div className="space-y-2">
              {category.tools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tool.desc}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">→</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
