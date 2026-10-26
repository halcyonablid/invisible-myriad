const { ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, parseYaml } = require("obsidian");
const path = require("path");
// Obsidian evaluates main.js with require/module/exports, not Node __dirname.
// Required modules are initialized from this plugin's manifest directory before
// any repository, settings, provider or scanning work starts.
let identity;
let identityTransaction;

const REVIEW_META_EVENT = "daily-note-review:review-meta-changed";
const ONTOLOGY_KEYWORD_READY_EVENT = "ontology-keyword-index:ready";
const ONTOLOGY_KEYWORD_UNAVAILABLE_EVENT = "ontology-keyword-index:unavailable";
const ONTOLOGY_KEYWORD_CHANGED_EVENT = "ontology-keyword-index:changed";
const ONTOLOGY_KEYWORD_CONTRACT_VERSION = 1;
const ONTOLOGY_KEYWORD_INDEX_VERSION = 1;

let pinyinPro = null;
try {
  pinyinPro = require(path.join(__dirname, "vendor", "pinyin-pro.js"));
} catch (error) {
  console.warn("[KeywordIndex][pinyin-sort.load-failed]", error);
}
const PINYIN_STATIC_CHAR_MAP = {
  "啊": "a",
  "爱": "ai",
  "碍": "ai",
  "安": "an",
  "按": "an",
  "案": "an",
  "暗": "an",
  "八": "ba",
  "巴": "ba",
  "把": "ba",
  "吧": "ba",
  "白": "bai",
  "摆": "bai",
  "败": "bai",
  "班": "ban",
  "般": "ban",
  "斑": "ban",
  "板": "ban",
  "版": "ban",
  "办": "ban",
  "半": "ban",
  "伴": "ban",
  "帮": "bang",
  "绑": "bang",
  "棒": "bang",
  "包": "bao",
  "宝": "bao",
  "保": "bao",
  "报": "bao",
  "暴": "bao",
  "爆": "bao",
  "杯": "bei",
  "碑": "bei",
  "北": "bei",
  "贝": "bei",
  "备": "bei",
  "背": "bei",
  "被": "bei",
  "奔": "ben",
  "本": "ben",
  "泵": "beng",
  "逼": "bi",
  "比": "bi",
  "笔": "bi",
  "必": "bi",
  "毕": "bi",
  "闭": "bi",
  "弊": "bi",
  "蔽": "bi",
  "避": "bi",
  "璧": "bi",
  "边": "bian",
  "编": "bian",
  "扁": "bian",
  "变": "bian",
  "便": "bian",
  "遍": "bian",
  "辩": "bian",
  "标": "biao",
  "表": "biao",
  "别": "bie",
  "柄": "bing",
  "并": "bing",
  "波": "bo",
  "剥": "bao",
  "播": "bo",
  "补": "bu",
  "捕": "bu",
  "不": "bu",
  "布": "bu",
  "步": "bu",
  "部": "bu",
  "才": "cai",
  "材": "cai",
  "财": "cai",
  "采": "cai",
  "彩": "cai",
  "参": "can",
  "惭": "can",
  "藏": "cang",
  "操": "cao",
  "册": "ce",
  "侧": "ce",
  "测": "ce",
  "策": "ce",
  "层": "ceng",
  "插": "cha",
  "查": "cha",
  "察": "cha",
  "差": "cha",
  "拆": "chai",
  "产": "chan",
  "肠": "chang",
  "尝": "chang",
  "偿": "chang",
  "常": "chang",
  "厂": "chang",
  "场": "chang",
  "敞": "chang",
  "超": "chao",
  "车": "che",
  "沉": "chen",
  "称": "cheng",
  "撑": "cheng",
  "成": "cheng",
  "承": "cheng",
  "城": "cheng",
  "乘": "cheng",
  "程": "cheng",
  "吃": "chi",
  "持": "chi",
  "齿": "chi",
  "充": "chong",
  "冲": "chong",
  "虫": "chong",
  "抽": "chou",
  "筹": "chou",
  "出": "chu",
  "初": "chu",
  "除": "chu",
  "础": "chu",
  "处": "chu",
  "触": "chu",
  "穿": "chuan",
  "传": "chuan",
  "窗": "chuang",
  "闯": "chuang",
  "创": "chuang",
  "纯": "chun",
  "词": "ci",
  "此": "ci",
  "次": "ci",
  "从": "cong",
  "粹": "cui",
  "存": "cun",
  "措": "cuo",
  "错": "cuo",
  "达": "da",
  "答": "da",
  "打": "da",
  "大": "da",
  "呆": "dai",
  "代": "dai",
  "带": "dai",
  "待": "dai",
  "袋": "dai",
  "单": "dan",
  "担": "dan",
  "旦": "dan",
  "但": "dan",
  "弹": "tan",
  "当": "dang",
  "档": "dang",
  "导": "dao",
  "岛": "dao",
  "到": "dao",
  "倒": "dao",
  "道": "dao",
  "得": "de",
  "德": "de",
  "地": "di",
  "的": "de",
  "灯": "deng",
  "登": "deng",
  "等": "deng",
  "低": "di",
  "敌": "di",
  "笛": "di",
  "底": "di",
  "递": "di",
  "第": "di",
  "典": "dian",
  "点": "dian",
  "电": "dian",
  "淀": "dian",
  "殿": "dian",
  "调": "tiao",
  "掉": "diao",
  "迭": "die",
  "叠": "die",
  "盯": "ding",
  "钉": "ding",
  "顶": "ding",
  "订": "ding",
  "定": "ding",
  "东": "dong",
  "懂": "dong",
  "动": "dong",
  "洞": "dong",
  "都": "dou",
  "兜": "dou",
  "斗": "dou",
  "独": "du",
  "读": "du",
  "堵": "du",
  "肚": "du",
  "度": "du",
  "端": "duan",
  "短": "duan",
  "段": "duan",
  "断": "duan",
  "锻": "duan",
  "队": "dui",
  "对": "dui",
  "沌": "dun",
  "顿": "dun",
  "遁": "dun",
  "多": "duo",
  "夺": "duo",
  "躲": "duo",
  "堕": "duo",
  "而": "er",
  "尔": "er",
  "二": "er",
  "发": "fa",
  "法": "fa",
  "番": "fan",
  "凡": "fan",
  "烦": "fan",
  "反": "fan",
  "泛": "fan",
  "范": "fan",
  "方": "fang",
  "防": "fang",
  "房": "fang",
  "仿": "fang",
  "访": "fang",
  "放": "fang",
  "飞": "fei",
  "非": "fei",
  "啡": "fei",
  "费": "fei",
  "分": "fen",
  "氛": "fen",
  "粉": "fen",
  "份": "fen",
  "丰": "feng",
  "风": "feng",
  "封": "feng",
  "否": "fou",
  "夫": "fu",
  "佛": "fo",
  "服": "fu",
  "符": "fu",
  "福": "fu",
  "辅": "fu",
  "负": "fu",
  "附": "fu",
  "复": "fu",
  "富": "fu",
  "赋": "fu",
  "缚": "fu",
  "该": "gai",
  "改": "gai",
  "概": "gai",
  "感": "gan",
  "干": "gan",
  "刚": "gang",
  "钢": "gang",
  "岗": "gang",
  "高": "gao",
  "搞": "gao",
  "告": "gao",
  "哥": "ge",
  "革": "ge",
  "格": "ge",
  "个": "ge",
  "各": "ge",
  "给": "gei",
  "根": "gen",
  "跟": "gen",
  "更": "geng",
  "工": "gong",
  "公": "gong",
  "功": "gong",
  "攻": "gong",
  "供": "gong",
  "宫": "gong",
  "共": "gong",
  "沟": "gou",
  "构": "gou",
  "购": "gou",
  "够": "gou",
  "估": "gu",
  "古": "gu",
  "故": "gu",
  "顾": "gu",
  "刮": "gua",
  "卦": "gua",
  "挂": "gua",
  "关": "guan",
  "观": "guan",
  "管": "guan",
  "惯": "guan",
  "光": "guang",
  "广": "guang",
  "归": "gui",
  "规": "gui",
  "轨": "gui",
  "贵": "gui",
  "滚": "gun",
  "国": "guo",
  "果": "guo",
  "裹": "guo",
  "过": "guo",
  "哈": "ha",
  "还": "hai",
  "海": "hai",
  "害": "hai",
  "含": "han",
  "汉": "han",
  "航": "hang",
  "好": "hao",
  "号": "hao",
  "耗": "hao",
  "喝": "he",
  "合": "he",
  "何": "he",
  "和": "he",
  "核": "he",
  "盒": "he",
  "贺": "he",
  "赫": "he",
  "黑": "hei",
  "痕": "hen",
  "很": "hen",
  "亨": "heng",
  "衡": "heng",
  "宏": "hong",
  "侯": "hou",
  "后": "hou",
  "候": "hou",
  "乎": "hu",
  "呼": "hu",
  "虎": "hu",
  "互": "hu",
  "户": "hu",
  "护": "hu",
  "花": "hua",
  "滑": "hua",
  "化": "hua",
  "划": "hua",
  "话": "hua",
  "坏": "huai",
  "欢": "huan",
  "环": "huan",
  "缓": "huan",
  "幻": "huan",
  "唤": "huan",
  "换": "huan",
  "黄": "huang",
  "谎": "huang",
  "灰": "hui",
  "恢": "hui",
  "回": "hui",
  "汇": "hui",
  "会": "hui",
  "绘": "hui",
  "慧": "hui",
  "魂": "hun",
  "混": "hun",
  "活": "huo",
  "火": "huo",
  "伙": "huo",
  "或": "huo",
  "获": "huo",
  "霍": "huo",
  "击": "ji",
  "机": "ji",
  "积": "ji",
  "基": "ji",
  "激": "ji",
  "及": "ji",
  "级": "ji",
  "即": "ji",
  "极": "ji",
  "集": "ji",
  "辑": "ji",
  "籍": "ji",
  "几": "ji",
  "己": "ji",
  "计": "ji",
  "记": "ji",
  "纪": "ji",
  "技": "ji",
  "际": "ji",
  "既": "ji",
  "济": "ji",
  "继": "ji",
  "寄": "ji",
  "加": "jia",
  "夹": "jia",
  "茄": "qie",
  "家": "jia",
  "假": "jia",
  "价": "jia",
  "架": "jia",
  "坚": "jian",
  "间": "jian",
  "监": "jian",
  "减": "jian",
  "检": "jian",
  "简": "jian",
  "见": "jian",
  "件": "jian",
  "建": "jian",
  "健": "jian",
  "渐": "jian",
  "践": "jian",
  "键": "jian",
  "箭": "jian",
  "将": "jiang",
  "讲": "jiang",
  "降": "jiang",
  "交": "jiao",
  "胶": "jiao",
  "焦": "jiao",
  "角": "jiao",
  "脚": "jiao",
  "搅": "jiao",
  "较": "jiao",
  "教": "jiao",
  "阶": "jie",
  "接": "jie",
  "街": "jie",
  "节": "jie",
  "洁": "jie",
  "结": "jie",
  "捷": "jie",
  "截": "jie",
  "解": "jie",
  "介": "jie",
  "界": "jie",
  "今": "jin",
  "金": "jin",
  "津": "jin",
  "仅": "jin",
  "尽": "jin",
  "紧": "jin",
  "谨": "jin",
  "劲": "jin",
  "近": "jin",
  "进": "jin",
  "浸": "jin",
  "经": "jing",
  "晶": "jing",
  "精": "jing",
  "景": "jing",
  "警": "jing",
  "净": "jing",
  "径": "jing",
  "竟": "jing",
  "境": "jing",
  "静": "jing",
  "究": "jiu",
  "九": "jiu",
  "旧": "jiu",
  "疚": "jiu",
  "就": "jiu",
  "居": "ju",
  "局": "ju",
  "巨": "ju",
  "句": "ju",
  "拒": "ju",
  "具": "ju",
  "惧": "ju",
  "据": "ju",
  "聚": "ju",
  "决": "jue",
  "绝": "jue",
  "觉": "jue",
  "均": "jun",
  "咖": "ka",
  "卡": "ka",
  "开": "kai",
  "慨": "kai",
  "堪": "kan",
  "看": "kan",
  "康": "kang",
  "慷": "kang",
  "抗": "kang",
  "考": "kao",
  "靠": "kao",
  "科": "ke",
  "壳": "ke",
  "可": "ke",
  "刻": "ke",
  "客": "ke",
  "课": "ke",
  "肯": "ken",
  "坑": "keng",
  "空": "kong",
  "恐": "kong",
  "控": "kong",
  "口": "kou",
  "库": "ku",
  "跨": "kua",
  "块": "kuai",
  "快": "kuai",
  "狂": "kuang",
  "况": "kuang",
  "框": "kuang",
  "愧": "kui",
  "困": "kun",
  "扩": "kuo",
  "括": "kuo",
  "阔": "kuo",
  "拉": "la",
  "啦": "la",
  "来": "lai",
  "赖": "lai",
  "览": "lan",
  "缆": "lan",
  "朗": "lang",
  "捞": "lao",
  "老": "lao",
  "乐": "le",
  "了": "liao",
  "雷": "lei",
  "类": "lei",
  "累": "lei",
  "楞": "leng",
  "离": "li",
  "礼": "li",
  "李": "li",
  "里": "li",
  "理": "li",
  "力": "li",
  "历": "li",
  "厉": "li",
  "立": "li",
  "利": "li",
  "例": "li",
  "连": "lian",
  "联": "lian",
  "练": "lian",
  "炼": "lian",
  "链": "lian",
  "两": "liang",
  "量": "liang",
  "疗": "liao",
  "料": "liao",
  "列": "lie",
  "林": "lin",
  "临": "lin",
  "灵": "ling",
  "聆": "ling",
  "零": "ling",
  "领": "ling",
  "令": "ling",
  "另": "ling",
  "溜": "liu",
  "流": "liu",
  "留": "liu",
  "六": "liu",
  "龙": "long",
  "拢": "long",
  "娄": "lou",
  "漏": "lou",
  "卢": "lu",
  "录": "lu",
  "路": "lu",
  "露": "lu",
  "旅": "lü",
  "履": "lü",
  "律": "lü",
  "虑": "lü",
  "率": "lü",
  "乱": "luan",
  "略": "lüe",
  "轮": "lun",
  "论": "lun",
  "罗": "luo",
  "逻": "luo",
  "螺": "luo",
  "络": "luo",
  "落": "luo",
  "麻": "ma",
  "马": "ma",
  "码": "ma",
  "吗": "ma",
  "埋": "mai",
  "脉": "mai",
  "蛮": "man",
  "满": "man",
  "曼": "man",
  "慢": "man",
  "漫": "man",
  "忙": "mang",
  "芒": "mang",
  "茫": "mang",
  "锚": "mao",
  "貌": "mao",
  "么": "me",
  "没": "mei",
  "媒": "mei",
  "每": "mei",
  "美": "mei",
  "门": "men",
  "们": "men",
  "猛": "meng",
  "迷": "mi",
  "秘": "mi",
  "密": "mi",
  "眠": "mian",
  "免": "mian",
  "面": "mian",
  "描": "miao",
  "秒": "miao",
  "名": "ming",
  "明": "ming",
  "命": "ming",
  "摸": "mo",
  "模": "mo",
  "摩": "mo",
  "磨": "mo",
  "末": "mo",
  "陌": "mo",
  "默": "mo",
  "谋": "mou",
  "某": "mou",
  "母": "mu",
  "姆": "mu",
  "目": "mu",
  "拿": "na",
  "哪": "na",
  "那": "na",
  "纳": "na",
  "乃": "nai",
  "奈": "nai",
  "南": "nan",
  "难": "nan",
  "脑": "nao",
  "闹": "nao",
  "呢": "ne",
  "内": "nei",
  "能": "neng",
  "嗯": "ng",
  "尼": "ni",
  "你": "ni",
  "拟": "ni",
  "逆": "ni",
  "年": "nian",
  "念": "nian",
  "怒": "nu",
  "诺": "nuo",
  "偶": "ou",
  "爬": "pa",
  "帕": "pa",
  "怕": "pa",
  "拍": "pai",
  "排": "pai",
  "牌": "pai",
  "盘": "pan",
  "判": "pan",
  "跑": "pao",
  "培": "pei",
  "佩": "pei",
  "配": "pei",
  "朋": "peng",
  "批": "pi",
  "皮": "pi",
  "匹": "pi",
  "偏": "pian",
  "片": "pian",
  "频": "pin",
  "品": "pin",
  "平": "ping",
  "评": "ping",
  "屏": "ping",
  "萍": "ping",
  "迫": "po",
  "破": "po",
  "朴": "pu",
  "普": "pu",
  "谱": "pu",
  "七": "qi",
  "期": "qi",
  "齐": "qi",
  "其": "qi",
  "奇": "qi",
  "启": "qi",
  "起": "qi",
  "气": "qi",
  "器": "qi",
  "迁": "qian",
  "签": "qian",
  "前": "qian",
  "钳": "qian",
  "浅": "qian",
  "强": "qiang",
  "敲": "qiao",
  "桥": "qiao",
  "巧": "qiao",
  "且": "qie",
  "切": "qie",
  "亲": "qin",
  "侵": "qin",
  "轻": "qing",
  "清": "qing",
  "情": "qing",
  "请": "qing",
  "穷": "qiong",
  "求": "qiu",
  "区": "qu",
  "曲": "qu",
  "驱": "qu",
  "趋": "qu",
  "取": "qu",
  "去": "qu",
  "趣": "qu",
  "圈": "quan",
  "全": "quan",
  "权": "quan",
  "拳": "quan",
  "缺": "que",
  "确": "que",
  "然": "ran",
  "让": "rang",
  "扰": "rao",
  "绕": "rao",
  "热": "re",
  "人": "ren",
  "认": "ren",
  "任": "ren",
  "日": "ri",
  "荣": "rong",
  "容": "rong",
  "如": "ru",
  "入": "ru",
  "软": "ruan",
  "弱": "ruo",
  "三": "san",
  "散": "san",
  "扫": "sao",
  "色": "se",
  "森": "sen",
  "啥": "sha",
  "傻": "sha",
  "山": "shan",
  "删": "shan",
  "扇": "shan",
  "善": "shan",
  "商": "shang",
  "熵": "shang",
  "上": "shang",
  "少": "shao",
  "绍": "shao",
  "哨": "shao",
  "设": "she",
  "社": "she",
  "射": "she",
  "涉": "she",
  "摄": "she",
  "伸": "shen",
  "身": "shen",
  "深": "shen",
  "什": "shen",
  "神": "shen",
  "沈": "shen",
  "审": "shen",
  "慎": "shen",
  "升": "sheng",
  "生": "sheng",
  "声": "sheng",
  "绳": "sheng",
  "胜": "sheng",
  "剩": "sheng",
  "失": "shi",
  "师": "shi",
  "施": "shi",
  "十": "shi",
  "石": "shi",
  "时": "shi",
  "识": "shi",
  "实": "shi",
  "拾": "shi",
  "食": "shi",
  "史": "shi",
  "使": "shi",
  "始": "shi",
  "世": "shi",
  "市": "shi",
  "示": "shi",
  "式": "shi",
  "事": "shi",
  "势": "shi",
  "视": "shi",
  "试": "shi",
  "室": "shi",
  "是": "shi",
  "适": "shi",
  "释": "shi",
  "匙": "chi",
  "收": "shou",
  "手": "shou",
  "守": "shou",
  "首": "shou",
  "受": "shou",
  "授": "shou",
  "书": "shu",
  "梳": "shu",
  "输": "shu",
  "熟": "shu",
  "属": "shu",
  "署": "shu",
  "术": "shu",
  "束": "shu",
  "述": "shu",
  "树": "shu",
  "数": "shu",
  "刷": "shua",
  "双": "shuang",
  "水": "shui",
  "税": "shui",
  "睡": "shui",
  "顺": "shun",
  "说": "shuo",
  "丝": "si",
  "司": "si",
  "思": "si",
  "斯": "si",
  "死": "si",
  "四": "si",
  "似": "si",
  "松": "song",
  "送": "song",
  "搜": "sou",
  "诉": "su",
  "素": "su",
  "速": "su",
  "算": "suan",
  "虽": "sui",
  "随": "sui",
  "缩": "suo",
  "所": "suo",
  "索": "suo",
  "他": "ta",
  "它": "ta",
  "塔": "ta",
  "拓": "tuo",
  "踏": "ta",
  "台": "tai",
  "太": "tai",
  "态": "tai",
  "坍": "tan",
  "谈": "tan",
  "探": "tan",
  "躺": "tang",
  "逃": "tao",
  "陶": "tao",
  "讨": "tao",
  "套": "tao",
  "特": "te",
  "梯": "ti",
  "提": "ti",
  "题": "ti",
  "体": "ti",
  "屉": "ti",
  "替": "ti",
  "天": "tian",
  "添": "tian",
  "挑": "tiao",
  "条": "tiao",
  "跳": "tiao",
  "贴": "tie",
  "听": "ting",
  "庭": "ting",
  "停": "ting",
  "婷": "ting",
  "挺": "ting",
  "通": "tong",
  "同": "tong",
  "瞳": "tong",
  "统": "tong",
  "筒": "tong",
  "偷": "tou",
  "头": "tou",
  "投": "tou",
  "透": "tou",
  "突": "tu",
  "图": "tu",
  "途": "tu",
  "推": "tui",
  "退": "tui",
  "拖": "tuo",
  "脱": "tuo",
  "哇": "wa",
  "外": "wai",
  "完": "wan",
  "玩": "wan",
  "晚": "wan",
  "万": "wan",
  "王": "wang",
  "网": "wang",
  "往": "wang",
  "望": "wang",
  "危": "wei",
  "威": "wei",
  "微": "wei",
  "围": "wei",
  "唯": "wei",
  "维": "wei",
  "伟": "wei",
  "尾": "wei",
  "炜": "wei",
  "为": "wei",
  "未": "wei",
  "位": "wei",
  "味": "wei",
  "谓": "wei",
  "文": "wen",
  "稳": "wen",
  "问": "wen",
  "涡": "wo",
  "我": "wo",
  "卧": "wo",
  "握": "wo",
  "乌": "wu",
  "无": "wu",
  "吴": "wu",
  "五": "wu",
  "午": "wu",
  "武": "wu",
  "舞": "wu",
  "务": "wu",
  "物": "wu",
  "悟": "wu",
  "雾": "wu",
  "吸": "xi",
  "西": "xi",
  "希": "xi",
  "析": "xi",
  "息": "xi",
  "悉": "xi",
  "晰": "xi",
  "习": "xi",
  "喜": "xi",
  "戏": "xi",
  "系": "xi",
  "细": "xi",
  "下": "xia",
  "先": "xian",
  "显": "xian",
  "险": "xian",
  "现": "xian",
  "线": "xian",
  "限": "xian",
  "陷": "xian",
  "献": "xian",
  "相": "xiang",
  "详": "xiang",
  "享": "xiang",
  "响": "xiang",
  "想": "xiang",
  "向": "xiang",
  "项": "xiang",
  "象": "xiang",
  "像": "xiang",
  "消": "xiao",
  "销": "xiao",
  "小": "xiao",
  "效": "xiao",
  "校": "xiao",
  "些": "xie",
  "协": "xie",
  "挟": "xie",
  "写": "xie",
  "械": "xie",
  "心": "xin",
  "芯": "xin",
  "新": "xin",
  "信": "xin",
  "行": "xing",
  "形": "xing",
  "型": "xing",
  "性": "xing",
  "凶": "xiong",
  "雄": "xiong",
  "休": "xiu",
  "修": "xiu",
  "秀": "xiu",
  "须": "xu",
  "虚": "xu",
  "需": "xu",
  "许": "xu",
  "序": "xu",
  "叙": "xu",
  "绪": "xu",
  "续": "xu",
  "漩": "xuan",
  "选": "xuan",
  "学": "xue",
  "寻": "xun",
  "巡": "xun",
  "询": "xun",
  "循": "xun",
  "训": "xun",
  "压": "ya",
  "雅": "ya",
  "呀": "ya",
  "延": "yan",
  "严": "yan",
  "言": "yan",
  "沿": "yan",
  "研": "yan",
  "眼": "yan",
  "演": "yan",
  "验": "yan",
  "阳": "yang",
  "仰": "yang",
  "养": "yang",
  "样": "yang",
  "药": "yao",
  "要": "yao",
  "钥": "yao",
  "也": "ye",
  "野": "ye",
  "业": "ye",
  "叶": "ye",
  "页": "ye",
  "一": "yi",
  "依": "yi",
  "移": "yi",
  "疑": "yi",
  "已": "yi",
  "以": "yi",
  "椅": "yi",
  "义": "yi",
  "忆": "yi",
  "议": "yi",
  "异": "yi",
  "役": "yi",
  "抑": "yi",
  "译": "yi",
  "易": "yi",
  "益": "yi",
  "意": "yi",
  "因": "yin",
  "音": "yin",
  "引": "yin",
  "饮": "yin",
  "隐": "yin",
  "印": "yin",
  "应": "ying",
  "英": "ying",
  "迎": "ying",
  "营": "ying",
  "影": "ying",
  "映": "ying",
  "硬": "ying",
  "拥": "yong",
  "勇": "yong",
  "用": "yong",
  "优": "you",
  "尤": "you",
  "由": "you",
  "游": "you",
  "友": "you",
  "有": "you",
  "又": "you",
  "右": "you",
  "幼": "you",
  "于": "yu",
  "余": "yu",
  "娱": "yu",
  "隅": "yu",
  "逾": "yu",
  "与": "yu",
  "予": "yu",
  "语": "yu",
  "育": "yu",
  "预": "yu",
  "域": "yu",
  "阈": "yu",
  "喻": "yu",
  "寓": "yu",
  "裕": "yu",
  "愈": "yu",
  "元": "yuan",
  "员": "yuan",
  "园": "yuan",
  "原": "yuan",
  "圆": "yuan",
  "援": "yuan",
  "源": "yuan",
  "远": "yuan",
  "院": "yuan",
  "愿": "yuan",
  "约": "yue",
  "月": "yue",
  "跃": "yue",
  "越": "yue",
  "云": "yun",
  "允": "yun",
  "运": "yun",
  "杂": "za",
  "咋": "za",
  "再": "zai",
  "在": "zai",
  "载": "zai",
  "攒": "zan",
  "暂": "zan",
  "早": "zao",
  "造": "zao",
  "噪": "zao",
  "则": "ze",
  "择": "ze",
  "责": "ze",
  "怎": "zen",
  "增": "zeng",
  "摘": "zhai",
  "粘": "nian",
  "展": "zhan",
  "战": "zhan",
  "栈": "zhan",
  "站": "zhan",
  "张": "zhang",
  "章": "zhang",
  "长": "chang",
  "掌": "zhang",
  "仗": "zhang",
  "账": "zhang",
  "障": "zhang",
  "找": "zhao",
  "召": "zhao",
  "赵": "zhao",
  "照": "zhao",
  "罩": "zhao",
  "折": "zhe",
  "哲": "zhe",
  "者": "zhe",
  "这": "zhe",
  "着": "zhe",
  "贞": "zhen",
  "针": "zhen",
  "真": "zhen",
  "诊": "zhen",
  "阵": "zhen",
  "争": "zheng",
  "整": "zheng",
  "正": "zheng",
  "证": "zheng",
  "之": "zhi",
  "支": "zhi",
  "知": "zhi",
  "织": "zhi",
  "执": "zhi",
  "直": "zhi",
  "值": "zhi",
  "职": "zhi",
  "植": "zhi",
  "止": "zhi",
  "只": "zhi",
  "旨": "zhi",
  "址": "zhi",
  "纸": "zhi",
  "指": "zhi",
  "至": "zhi",
  "志": "zhi",
  "制": "zhi",
  "质": "zhi",
  "秩": "zhi",
  "致": "zhi",
  "智": "zhi",
  "稚": "zhi",
  "置": "zhi",
  "中": "zhong",
  "终": "zhong",
  "钟": "zhong",
  "种": "zhong",
  "重": "zhong",
  "周": "zhou",
  "骤": "zhou",
  "珠": "zhu",
  "逐": "zhu",
  "主": "zhu",
  "住": "zhu",
  "助": "zhu",
  "注": "zhu",
  "抓": "zhua",
  "拽": "zhuai",
  "专": "zhuan",
  "转": "zhuan",
  "撰": "zhuan",
  "装": "zhuang",
  "状": "zhuang",
  "追": "zhui",
  "准": "zhun",
  "捉": "zhuo",
  "酌": "zhuo",
  "咨": "zi",
  "姿": "zi",
  "资": "zi",
  "子": "zi",
  "字": "zi",
  "自": "zi",
  "宗": "zong",
  "综": "zong",
  "踪": "zong",
  "总": "zong",
  "纵": "zong",
  "走": "zou",
  "奏": "zou",
  "足": "zu",
  "阻": "zu",
  "组": "zu",
  "最": "zui",
  "左": "zuo",
  "作": "zuo",
  "坐": "zuo",
  "座": "zuo",
  "做": "zuo"
};

const VIEW_TYPE_KEYWORD_INDEX = "keyword-index-plugin-view";
const KEYWORD_EVA_VIEW_TYPE = "keyword-index-plugin";
const KEYWORD_EVA_VIEW_LABEL = "关键词索引管理器";
const KEYWORD_EVA_OPENER_ID = "keyword-index-plugin-opener";
const LETTER_GROUP_SECONDARY_NAV_THRESHOLD = 30;

const DEFAULT_SETTINGS = {
  indexPath: "data/keyword_index.json",
  scanFolder: "",
  autoSyncOnRename: true,
  evaNoteCandidatePaths: ["EVA_Notes.json", "data/EVA_Notes.json"],
  keywordComments: {},
  uiState: {
    capsuleExpanded: {},
    notesDrawerOpen: {},
    drawerExpanded: {},
    keywordViewMode: "all",
  },
};

const KEYWORD_VIEW_MODE_ALL = "all";
const KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE = "symbol-dialogue";

const SOURCE_COLORS = {
  yaml: { bg: "rgba(0, 122, 255, 0.12)", border: "rgba(0, 122, 255, 0.3)", text: "#007AFF", label: "YAML关键词管理", icon: "◆" },
  plus: { bg: "rgba(255, 149, 0, 0.12)", border: "rgba(255, 149, 0, 0.3)", text: "#D47300", label: "层级关键词 ++...++", icon: "▲" },
  dot: { bg: "rgba(142, 68, 173, 0.1)", border: "rgba(142, 68, 173, 0.25)", text: "#8E44AD", label: "行内关键词 ··...··", icon: "●" },
  mixed: { bg: "rgba(46, 204, 113, 0.12)", border: "rgba(46, 204, 113, 0.35)", text: "#2ECC71", label: "混合来源", icon: "◇" },
};

function text(value, fallback = "") {
  const normalized = String(value == null ? "" : value).trim();
  return normalized || fallback;
}

function clone(value, fallback = null) {
  try {
    return value == null ? fallback : JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function nowString() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function todayDateString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function currentTimeString() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeBooleanMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (raw === true) out[text(key)] = true;
  });
  return out;
}

function normalizeAnyBooleanMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (raw === true || raw === false) out[text(key)] = raw;
  });
  return out;
}

function normalizeKeywordViewMode(value) {
  return value === KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE ? KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE : KEYWORD_VIEW_MODE_ALL;
}

function normalizeKeywordCommentEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = {
    comment: text(value.comment),
    guide: text(value.guide),
    references: text(value.references),
    keywordId: text(value.keywordId),
    label: text(value.label),
    nodeKind: text(value.nodeKind),
    updatedAt: text(value.updatedAt),
  };
  if (!entry.comment && !entry.guide && !entry.references) return null;
  return entry;
}

function normalizeKeywordComments(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  Object.entries(value).forEach(([key, raw]) => {
    const normalized = normalizeKeywordCommentEntry(raw);
    if (normalized) out[text(key)] = normalized;
  });
  return out;
}

function hasKeywordCommentContent(entry) {
  return Boolean(text(entry?.comment) || text(entry?.guide) || text(entry?.references));
}

function getNoteHeatClass(count) {
  const value = Number(count) || 0;
  if (value >= 40) return " note-heat-xl";
  if (value >= 15) return " note-heat-lg";
  if (value >= 5) return " note-heat-md";
  if (value >= 1) return " note-heat-sm";
  return "";
}

function normalizeKeywordNote(note = {}) {
  return {
    path: text(note.path),
    name: text(note.name, text(note.path, "Untitled")),
    suffix: text(note.suffix),
    sourceType: text(note.sourceType),
  };
}

function normalizeKeyword(raw = {}) {
  const id = text(raw.id, text(raw.baseKeyword, text(raw.displayText, `kw_${Date.now()}`)));
  const notes = Array.isArray(raw.notes) ? raw.notes.map(normalizeKeywordNote).filter((note) => note.path || note.name) : [];
  return {
    id,
    baseKeyword: text(raw.baseKeyword, text(raw.displayText, id)),
    displayText: text(raw.displayText, text(raw.baseKeyword, id)),
    type: text(raw.type, "yaml"),
    parentId: text(raw.parentId),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    notes,
    sortKey: text(raw.sortKey),
    sortLetter: text(raw.sortLetter),
    identityStatus: raw.identityStatus === "unavailable" ? "unavailable" : "active",
  };
}

function normalizeLegacyIndex(raw = {}) {
  if (Object.prototype.hasOwnProperty.call(raw, "identityRegistry")) identity.validate(raw.identityRegistry);
  const keywords = {};
  const rawKeywords = raw && typeof raw === "object" && raw.keywords && typeof raw.keywords === "object" ? raw.keywords : {};
  Object.entries(rawKeywords).forEach(([key, value]) => {
    const keyword = normalizeKeyword(Object.assign({}, value, { id: text(value?.id, key) }));
    keywords[keyword.id] = keyword;
  });
  return {
    keywords,
    identityRegistry: raw.identityRegistry ? identity.copy(raw.identityRegistry) : null,
    uiState: {
      capsuleExpanded: normalizeBooleanMap(raw.capsuleExpanded),
      notesDrawerOpen: normalizeBooleanMap(raw.notesDrawerOpen),
      drawerExpanded: normalizeBooleanMap(raw.drawerExpanded),
    },
    meta: {
      loadedAt: nowString(),
      total: Object.keys(keywords).length,
      topLevel: Object.values(keywords).filter((keyword) => !keyword.parentId).length,
      rawMeta: clone(raw.meta || {}, {}),
    },
  };
}

function parseKeywordWithSuffix(rawValue) {
  const value = text(rawValue);
  if (!value) return null;
  const plusIndex = value.indexOf("+");
  if (plusIndex < 0) return { baseKeyword: value, suffix: "", type: "yaml" };
  return {
    baseKeyword: text(value.slice(0, plusIndex)),
    suffix: text(value.slice(plusIndex)),
    type: "plus",
  };
}

function normalizeKeywordListValue(raw) {
  if (Array.isArray(raw)) return raw.map((item) => text(item)).filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(/[\n,，]/).map((item) => text(item)).filter(Boolean);
  }
  return [];
}

function extractKeywordManagementValuesFromMarkdown(content) {
  const value = String(content || "");
  const lines = value.split(/\r?\n/);
  if (text(lines[0]) !== "---") return [];
  const out = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (text(line) === "---") break;
    const keyMatch = line.match(/^关键词管理\s*:\s*(.*)$/);
    if (!keyMatch) continue;
    const inline = text(keyMatch[1]);
    if (inline && inline !== "[]") out.push(...normalizeKeywordListValue(inline.replace(/^\[|\]$/g, "")));
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const itemMatch = lines[cursor].match(/^\s*-\s*(.+?)\s*$/);
      if (!itemMatch) break;
      out.push(text(itemMatch[1]).replace(/^['"]|['"]$/g, ""));
      index = cursor;
    }
  }
  return out.filter(Boolean);
}

function getKeywordSortText(keyword) {
  return text(keyword.displayText, keyword.baseKeyword).localeCompare ? text(keyword.displayText, keyword.baseKeyword) : "";
}

const PINYIN_PHRASE_SORT_OVERRIDES = [
  ["长期", "changqi"],
  ["长远", "changyuan"],
  ["长线", "changxian"],
  ["长程", "changcheng"],
];
const PINYIN_CHAR_SORT_OVERRIDES = {
  "长": "chang",
};

function isChineseChar(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function convertChineseRunToPinyinTokens(value) {
  const raw = text(value);
  if (!raw) return [];
  try {
    const converted = pinyinPro?.pinyin?.(raw, { toneType: "none", type: "array" });
    if (Array.isArray(converted) && converted.length > 0) {
      return converted.map((item) => text(item).toLowerCase()).filter(Boolean);
    }
  } catch (error) {
    console.warn("[KeywordIndex][pinyin-sort.convert-failed]", { value: raw, error });
  }
  return Array.from(raw).map((ch) => text(PINYIN_CHAR_SORT_OVERRIDES[ch], text(PINYIN_STATIC_CHAR_MAP[ch], ch)).toLowerCase()).filter(Boolean);
}

function getPinyinSortKey(value) {
  const raw = text(value).toLowerCase();
  if (!raw) return "";
  const tokens = [];
  for (let index = 0; index < raw.length; index += 1) {
    const rest = raw.slice(index);
    const phrase = PINYIN_PHRASE_SORT_OVERRIDES.find(([prefix]) => rest.startsWith(prefix));
    if (phrase) {
      tokens.push(phrase[1]);
      index += phrase[0].length - 1;
      continue;
    }
    const ch = raw.charAt(index);
    const ascii = rest.match(/^[a-z0-9]+/);
    if (ascii) {
      tokens.push(ascii[0]);
      index += ascii[0].length - 1;
      continue;
    }
    if (PINYIN_CHAR_SORT_OVERRIDES[ch]) {
      tokens.push(PINYIN_CHAR_SORT_OVERRIDES[ch]);
      continue;
    }
    if (isChineseChar(ch)) {
      let cursor = index + 1;
      while (cursor < raw.length && isChineseChar(raw.charAt(cursor))) cursor += 1;
      tokens.push(...convertChineseRunToPinyinTokens(raw.slice(index, cursor)));
      index = cursor - 1;
      continue;
    }
    if (!/\s/.test(ch)) tokens.push(ch);
  }
  return tokens.join(" ").trim();
}

function getKeywordSortBucket(value) {
  const raw = text(value).replace(/^[_\.+\s-]+/, "");
  const first = raw.charAt(0);
  if (!first) return 3;
  if (/[0-9]/.test(first)) return 0;
  if (isChineseChar(first)) return 1;
  if (/[A-Za-z]/.test(first)) return 2;
  return 3;
}

function compareKeywordByPinyin(a, b) {
  const rawA = getKeywordSortText(a);
  const rawB = getKeywordSortText(b);
  const bucketA = getKeywordSortBucket(rawA);
  const bucketB = getKeywordSortBucket(rawB);
  if (bucketA !== bucketB) return bucketA - bucketB;
  const keyA = getPinyinSortKey(rawA);
  const keyB = getPinyinSortKey(rawB);
  return keyA.localeCompare(keyB, "en", { numeric: true, sensitivity: "base" })
    || rawA.localeCompare(rawB, "zh-CN", { numeric: true, sensitivity: "base" });
}

function generateKeywordId(baseKeyword) {
  const value = text(baseKeyword);
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash &= hash;
  }
  return `kw-${Math.abs(hash).toString(36)}`;
}

function normalizeKeywordRefLookupKey(value) {
  return text(value).replace(/\s+/g, " ").toLocaleLowerCase();
}

function extractBoldKeywordRefTexts(value) {
  const source = text(value);
  if (!source) return [];
  const out = [];
  const regex = /\*\*([^*\n]+?)\*\*/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const label = text(match[1]);
    if (label) out.push(label);
  }
  return out;
}

function computeSortKey(notes) {
  return getMinAtomSortCodeFromNotes(notes);
}

function extractAtomSortCodeFromNote(note) {
  const source = `${text(note?.path)} ${text(note?.name)}`;
  const match = source.match(/ATOM@([0-9A-Z.+]+)/i);
  return text(match?.[1]);
}

function sortAtomCodeKey(code) {
  return text(code).split(/(\d+)/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function compareAtomSortCodes(a, b) {
  const left = sortAtomCodeKey(a);
  const right = sortAtomCodeKey(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] == null) return -1;
    if (right[index] == null) return 1;
    if (left[index] === right[index]) continue;
    return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

function compareOptionalAtomSortCodes(a, b) {
  const left = text(a);
  const right = text(b);
  if (left && right) return compareAtomSortCodes(left, right);
  if (left) return -1;
  if (right) return 1;
  return 0;
}

function getMinAtomSortCodeFromNotes(notes) {
  const candidates = [];
  (notes || []).forEach((note) => {
    const code = extractAtomSortCodeFromNote(note);
    if (code) candidates.push(code);
  });
  if (candidates.length === 0) return "";
  return candidates.sort(compareAtomSortCodes)[0];
}

function getDisplayText(keyword) {
  const value = text(keyword);
  return value.length > 1 && /^[A-Z]/.test(value) ? value.substring(1) : value;
}

function getSortLetter(keyword) {
  const cleaned = text(keyword).replace(/^[_\.+\s]+/, "");
  const first = cleaned.charAt(0);
  return first && /[A-Za-z]/.test(first) ? first.toUpperCase() : "#";
}

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function timestampForFileName() {
  return nowString().replace(/[-:]/g, "").replace(" ", "-");
}

function getKeywordSourceTypes(keyword) {
  const types = new Set();
  (keyword.notes || []).forEach((note) => types.add(text(note.sourceType, keyword.type)));
  if (types.size === 0) types.add(text(keyword.type, "yaml"));
  return Array.from(types);
}

function collectColorDebugPath(node) {
  const path = [];
  let current = node;
  while (current && path.length < 12) {
    const style = current instanceof HTMLElement ? window.getComputedStyle(current) : null;
    path.push({
      tag: current?.tagName || "",
      className: text(current?.className),
      dataset: current?.dataset ? Object.fromEntries(Object.entries(current.dataset)) : {},
      background: style?.backgroundColor || "",
      borderColor: style?.borderColor || "",
      display: style?.display || "",
    });
    current = current.parentElement || null;
  }
  return path;
}

function logKeywordColorDebug(targetEl, label) {
  if (!(targetEl instanceof HTMLElement)) return;
  const ancestry = collectColorDebugPath(targetEl);
  const visibleBackgrounds = ancestry
    .map((entry, index) => ({ index, ...entry }))
    .filter((entry) => entry.background && entry.background !== "rgba(0, 0, 0, 0)" && entry.background !== "transparent");
  const pinkLike = visibleBackgrounds.filter((entry) => {
    const match = entry.background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return false;
    const red = Number(match[1]);
    const green = Number(match[2]);
    const blue = Number(match[3]);
    return red >= 235 && green >= 200 && green <= 235 && blue >= 200 && blue <= 235;
  });
  const payload = {
    className: targetEl.className,
    dataset: targetEl.dataset ? Object.fromEntries(Object.entries(targetEl.dataset)) : {},
    computed: {
      background: window.getComputedStyle(targetEl).backgroundColor,
      borderColor: window.getComputedStyle(targetEl).borderColor,
      display: window.getComputedStyle(targetEl).display,
    },
    visibleBackgrounds,
    pinkLike,
    ancestry,
  };
  console.info("[KeywordIndex][color-debug]", label, payload);
  console.table(visibleBackgrounds.map((entry) => ({
    index: entry.index,
    tag: entry.tag,
    className: entry.className,
    background: entry.background,
    borderColor: entry.borderColor,
    display: entry.display,
  })));
  if (pinkLike.length > 0) console.warn("[KeywordIndex][color-debug.pink-like]", label, pinkLike);
}

function groupKeywordsByLetter(keywords) {
  const groups = new Map();
  keywords.forEach((keyword) => {
    const letter = getKeywordGroupLetter(keyword);
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(keyword);
  });
  Array.from(groups.values()).forEach((items) => items.sort(compareKeywordByPinyin));
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-CN"));
}

function getKeywordGroupLetter(keyword) {
  const label = text(keyword?.baseKeyword, keyword?.displayText);
  return text(keyword?.sortLetter, getSortLetter(label) || "#");
}

function filterSameLetterChildAliasesForGlobalGroups(keywords, visibleKeywordIds, keywordsById = {}) {
  const visibleIds = visibleKeywordIds instanceof Set ? visibleKeywordIds : new Set();
  return keywords.filter((keyword) => {
    const parentId = text(keyword?.parentId);
    if (!parentId) return true;
    const parent = keywordsById[parentId];
    if (!parent || !visibleIds.has(parent.id)) return true;
    return getKeywordGroupLetter(keyword).toUpperCase() !== getKeywordGroupLetter(parent).toUpperCase();
  });
}

function getLetterGroupSecondaryKey(keyword, letter) {
  const label = text(getKeywordSortText(keyword), text(keyword.baseKeyword, keyword.displayText));
  const sortKey = getPinyinSortKey(label).replace(/^[_\.+\s-]+/, "").trim();
  const pinyinPrefix = sortKey.match(/[a-z0-9]+/i);
  if (pinyinPrefix) return pinyinPrefix[0].toUpperCase();
  const cleaned = label.replace(/^[_\.+\s]+/, "").trim();
  if (!cleaned) return "#";
  const asciiPrefix = cleaned.match(/^[A-Za-z0-9]+/);
  if (asciiPrefix) return asciiPrefix[0].toUpperCase();
  return cleaned.charAt(0).toUpperCase();
}

function getLetterGroupSecondaryLabel(keyword, letter) {
  const label = text(getKeywordSortText(keyword), text(keyword.baseKeyword, keyword.displayText));
  const cleaned = label.replace(/^[_\.+\s-]+/, "").trim();
  if (!cleaned) return "#";
  const first = cleaned.charAt(0);
  if (isChineseChar(first)) return first;
  const asciiPrefix = cleaned.match(/^[A-Za-z0-9]+/);
  if (asciiPrefix) return asciiPrefix[0].toUpperCase();
  return first.toUpperCase();
}

function groupKeywordsBySecondaryKey(keywords, letter) {
  const groups = new Map();
  keywords.forEach((keyword) => {
    const key = getLetterGroupSecondaryKey(keyword, letter);
    if (!groups.has(key)) groups.set(key, { key, label: getLetterGroupSecondaryLabel(keyword, letter), items: [] });
    groups.get(key).items.push(keyword);
  });
  return Array.from(groups.values())
    .map((group) => Object.assign({}, group, { items: group.items.slice().sort(compareKeywordByPinyin) }))
    .sort((a, b) => compareKeywordByPinyin(a.items[0], b.items[0]));
}

function splitSuffixParts(suffix) {
  return text(suffix).split("+").map((part) => text(part)).filter(Boolean);
}

function parseSubconceptSegment(segment) {
  const value = text(segment);
  const match = value.match(/^SCON\.(.+)$/i);
  const label = text(match?.[1]);
  if (!label) return null;
  const locator = parseSubconceptLocatorLabel(label);
  return { raw: value, label, displayLabel: locator.displayLabel, groupLetter: locator.groupLetter };
}

function parseSubconceptLocatorLabel(label) {
  const raw = text(label);
  const cleaned = raw.replace(/^[_\.+\s-]+/, "").trim();
  if (!cleaned) return { displayLabel: raw, groupLetter: "#" };
  const first = cleaned.charAt(0);
  const rest = cleaned.slice(1);
  if (/[A-Za-z]/.test(first) && rest) {
    const restForCheck = rest.replace(/^[\s._-]+/, "");
    if (restForCheck && !/^[A-Za-z0-9]/.test(restForCheck.charAt(0))) {
      return { displayLabel: restForCheck, groupLetter: first.toUpperCase() };
    }
  }
  return { displayLabel: raw, groupLetter: getLetterGroupSecondaryLabel({ displayText: raw, baseKeyword: raw }, "ALL") };
}

function getSubconceptPathLabel(part) {
  return parseSubconceptSegment(part)?.displayLabel || text(part);
}

function getSubconceptRawPathPart(node) {
  return text(node?.rawLabel, node?.kind === "subconcept" ? `SCON.${node?.label || ""}` : node?.label);
}

function getTreePathDisplayParts(pathParts = []) {
  return (pathParts || []).map((part) => getSubconceptPathLabel(part)).filter(Boolean);
}

function getTreePathDisplayLabel(pathParts = [], separator = " / ") {
  return getTreePathDisplayParts(pathParts).join(separator);
}

function buildSuffixFromParts(parts) {
  const cleanParts = (parts || []).map((part) => text(part)).filter(Boolean);
  return cleanParts.length > 0 ? `+${cleanParts.join("+")}` : "";
}

function parseBusSegment(segment) {
  const value = text(segment);
  const match = value.match(/^BUS(\d+)\.(.+)$/i) || value.match(/^BUS\.(\d+)$/i);
  if (!match) return null;
  const label = text(match[2], match[1]);
  if (!label) return null;
  return {
    raw: value,
    number: parseInt(match[1], 10),
    width: match[1].length,
    label,
  };
}

function buildBusSegment(number, width, label) {
  return `BUS${String(Number(number) || 0).padStart(Math.max(Number(width) || 0, 1), "0")}.${text(label)}`;
}

function buildKeywordPathText(baseKeyword, parts = []) {
  return [text(baseKeyword), ...(parts || []).map((part) => text(part)).filter(Boolean)].filter(Boolean).join("+");
}

function parseNoteNameParts(noteName) {
  const clean = text(noteName).replace(/\.md$/i, "");
  const splitIndex = clean.indexOf("- ");
  if (splitIndex < 0) return { code: clean, title: "" };
  return { code: text(clean.slice(0, splitIndex)), title: text(clean.slice(splitIndex + 2)) };
}

function incrementCode(code) {
  const match = text(code).match(/(\d{3}|[A-Z])$/);
  if (!match) return text(code);
  const lastPart = match[0];
  if (/^\d{3}$/.test(lastPart)) return text(code).slice(0, -3) + String(parseInt(lastPart, 10) + 1).padStart(3, "0");
  return text(code).slice(0, -1) + String.fromCharCode(lastPart.charCodeAt(0) + 1);
}

function extendCode(code) {
  const lastPart = text(code).match(/(\d{3}|[A-Z])$/)?.[0] || "";
  if (/^\d{3}$/.test(lastPart)) return `${code}A`;
  return `${code}001`;
}

function yamlScalar(value, forceQuotes = false) {
  if (Array.isArray(value)) return JSON.stringify(value).replace(/,/g, ", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const safe = text(value).replace(/"/g, '\\"');
  return forceQuotes || /[:\[\]\{\}#]/.test(safe) ? `"${safe}"` : safe;
}

function buildKeywordYamlBlock(values) {
  const seen = new Set();
  const list = [];
  (values || []).forEach((value) => {
    const item = text(value);
    if (!item || seen.has(item)) return;
    seen.add(item);
    list.push(item);
  });
  if (list.length === 0) return "关键词管理: []";
  return ["关键词管理:", ...list.map((value) => `  - ${yamlScalar(value, true)}`)].join("\n");
}

function parseYamlScalarText(raw) {
  const value = text(raw);
  if (!value) return "";
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'").trim();
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replace(/\\"/g, '"').trim();
  return value;
}

function extractKeywordValuesFromYamlBody(yamlBody) {
  const lines = String(yamlBody || "").split("\n");
  const start = lines.findIndex((line) => /^\s*关键词管理\s*:/.test(line));
  if (start < 0) return [];
  const inline = lines[start].replace(/^\s*关键词管理\s*:\s*/, "").trim();
  if (inline) {
    if (inline === "[]") return [];
    if (inline.startsWith("[") && inline.endsWith("]")) {
      return inline.slice(1, -1).split(",").map((item) => parseYamlScalarText(item)).filter(Boolean);
    }
    const value = parseYamlScalarText(inline);
    return value ? [value] : [];
  }
  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*$/.test(line)) continue;
    if (/^[^\s#][^:]*\s*:/.test(line)) break;
    const listItem = line.match(/^\s*-\s*(.+?)\s*$/);
    if (listItem) {
      const value = parseYamlScalarText(listItem[1]);
      if (value) values.push(value);
      continue;
    }
    if (!/^\s/.test(line)) break;
  }
  return values;
}

function readIdentityYamlValues(yamlBody) {
  const parsed = parseYaml(yamlBody) || {};
  const value = parsed["关键词管理"];
  if (value == null) return [];
  const values = Array.isArray(value) ? value : [value];
  if (values.some((item) => typeof item !== "string")) throw new Error("关键词管理必须是字符串或字符串列表");
  return values.map((item) => item.trim()).filter(Boolean);
}

function replaceIdentityYamlValues(yamlBody, values) {
  const before = parseYaml(yamlBody) || {};
  const placeholder = replaceOrAppendKeywordYamlField(yamlBody, ["__IDENTITY_REPLACEMENT__"]);
  const block = values.length ? ["关键词管理:", ...values.map((value) => "  - " + JSON.stringify(value))].join("\n") : "关键词管理: []";
  const next = placeholder.replace(/关键词管理:\n\s*-\s*"__IDENTITY_REPLACEMENT__"/, () => block);
  const after = parseYaml(next) || {};
  if (JSON.stringify(after["关键词管理"]) !== JSON.stringify(values)) throw new Error("关键词 YAML 回读不一致");
  delete before["关键词管理"]; delete after["关键词管理"];
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("更新会改变其他 YAML 属性，已停止");
  return next;
}

function replaceOrAppendKeywordYamlField(yamlBody, keywordValues) {
  const lines = String(yamlBody || "").split("\n");
  const start = lines.findIndex((line) => /^\s*关键词管理\s*:/.test(line));
  const replacement = buildKeywordYamlBlock(keywordValues).split("\n");
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length) {
      const line = lines[end];
      if (/^\s*$/.test(line)) {
        end += 1;
        continue;
      }
      if (/^[^\s#][^:]*\s*:/.test(line)) break;
      if (/^\s/.test(line)) {
        end += 1;
        continue;
      }
      break;
    }
    lines.splice(start, end - start, ...replacement);
    return lines.join("\n");
  }
  const trimmed = String(yamlBody || "").trim();
  return trimmed ? `${yamlBody}\n${buildKeywordYamlBlock(keywordValues)}` : buildKeywordYamlBlock(keywordValues);
}

function hasIllegalFileNameChars(value) {
  return /[\\/:*?"<>|]/.test(text(value));
}

function dirname(path) {
  const value = String(path || "");
  const index = value.lastIndexOf("/");
  return index >= 0 ? value.slice(0, index) : "";
}

function joinVaultPath(dir, name) {
  return dir ? `${dir}/${name}` : name;
}

function buildSuffixTree(notes) {
  const root = { children: new Map(), notes: [], subconcepts: new Map() };
  notes.forEach((note) => {
    const parts = splitSuffixParts(note.suffix);
    if (parts.length === 0) {
      root.notes.push(note);
      return;
    }
    let current = root;
    let previousWasSubconcept = false;
    parts.forEach((part, index) => {
      const subconcept = parseSubconceptSegment(part);
      const isSubconceptNode = Boolean(subconcept && !previousWasSubconcept);
      const isInvalidDirectSubconcept = Boolean(subconcept && previousWasSubconcept);
      const bucket = isSubconceptNode ? "subconcepts" : "children";
      const label = isSubconceptNode ? subconcept.label : part;
      const rawLabel = isSubconceptNode ? subconcept.raw : part;
      if (!current[bucket]) current[bucket] = new Map();
      if (!current[bucket].has(label)) current[bucket].set(label, {
        label,
        displayLabel: isSubconceptNode ? subconcept.displayLabel : label,
        subconceptGroupLetter: isSubconceptNode ? subconcept.groupLetter : "",
        rawLabel,
        kind: bucket === "subconcepts" ? "subconcept" : "drawer",
        invalidSubconceptNesting: false,
        children: new Map(),
        notes: [],
        subconcepts: new Map(),
      });
      current = current[bucket].get(label);
      if (isInvalidDirectSubconcept) current.invalidSubconceptNesting = true;
      previousWasSubconcept = bucket === "subconcepts";
      if (index === parts.length - 1) current.notes.push(note);
    });
  });
  applyDrawerSortCodes(root);
  return root;
}

function getSuffixTreeNodePathPart(node) {
  return node?.kind === "subconcept" ? getSubconceptRawPathPart(node) : text(node?.rawLabel, node?.label);
}

function cloneSuffixTreeNode(node, includeDescendants = true) {
  const clone = Object.assign({}, node, {
    notes: [...(node?.notes || [])],
    children: new Map(),
    subconcepts: new Map(),
  });
  if (!includeDescendants) return clone;
  for (const [key, child] of node?.children?.entries?.() || []) clone.children.set(key, cloneSuffixTreeNode(child, true));
  for (const [key, child] of node?.subconcepts?.entries?.() || []) clone.subconcepts.set(key, cloneSuffixTreeNode(child, true));
  return clone;
}

function getSuffixTreeProjectionRole(pathParts, seedPaths) {
  const role = { ancestor: false, shallow: false, full: false };
  for (const seedPath of seedPaths || []) {
    if (seedPath.length === 0 || startsWithPathParts(pathParts, seedPath)) {
      role.full = true;
      break;
    }
    if (startsWithPathParts(seedPath, pathParts)) role.ancestor = true;
    const sameLevel = pathParts.length === seedPath.length
      && samePathParts(pathParts.slice(0, -1), seedPath.slice(0, -1));
    if (sameLevel) role.shallow = true;
  }
  return role;
}

function projectSuffixTreeNode(node, pathParts, seedPaths) {
  const role = getSuffixTreeProjectionRole(pathParts, seedPaths);
  if (!role.full && !role.ancestor && !role.shallow) return null;
  if (role.full) return cloneSuffixTreeNode(node, true);
  const projected = cloneSuffixTreeNode(node, false);
  if (!role.shallow) projected.notes = [];
  if (role.ancestor) {
    for (const [key, child] of node?.children?.entries?.() || []) {
      const childPath = [...pathParts, getSuffixTreeNodePathPart(child)];
      const projectedChild = projectSuffixTreeNode(child, childPath, seedPaths);
      if (projectedChild) projected.children.set(key, projectedChild);
    }
    for (const [key, child] of node?.subconcepts?.entries?.() || []) {
      const childPath = [...pathParts, getSuffixTreeNodePathPart(child)];
      const projectedChild = projectSuffixTreeNode(child, childPath, seedPaths);
      if (projectedChild) projected.subconcepts.set(key, projectedChild);
    }
  }
  return projected;
}

function projectSuffixTree(tree, seedPaths) {
  const cleanSeedPaths = (seedPaths || []).map((parts) => (parts || []).map((part) => text(part)).filter(Boolean));
  if (cleanSeedPaths.some((parts) => parts.length === 0)) return cloneSuffixTreeNode(tree, true);
  const projected = Object.assign({}, tree, { notes: [], children: new Map(), subconcepts: new Map() });
  for (const [key, child] of tree?.children?.entries?.() || []) {
    const childPath = [getSuffixTreeNodePathPart(child)];
    const projectedChild = projectSuffixTreeNode(child, childPath, cleanSeedPaths);
    if (projectedChild) projected.children.set(key, projectedChild);
  }
  for (const [key, child] of tree?.subconcepts?.entries?.() || []) {
    const childPath = [getSuffixTreeNodePathPart(child)];
    const projectedChild = projectSuffixTreeNode(child, childPath, cleanSeedPaths);
    if (projectedChild) projected.subconcepts.set(key, projectedChild);
  }
  return projected;
}

function suffixTreeHasContent(tree) {
  return Boolean((tree?.notes || []).length || tree?.children?.size || tree?.subconcepts?.size);
}

function collectSuffixTreeNotes(tree, sourceType, output = [], seen = new Set()) {
  for (const note of tree?.notes || []) {
    const identity = [text(sourceType), text(note?.suffix), text(note?.path), text(note?.name)].join("\u0000");
    if (seen.has(identity)) continue;
    seen.add(identity);
    output.push(note);
  }
  for (const child of tree?.children?.values?.() || []) collectSuffixTreeNotes(child, sourceType, output, seen);
  for (const child of tree?.subconcepts?.values?.() || []) collectSuffixTreeNotes(child, sourceType, output, seen);
  return output;
}

function applyDrawerSortCodes(node) {
  const candidates = [];
  const directCode = getMinAtomSortCodeFromNotes(node?.notes || []);
  node.directSortCode = directCode || "";
  if (directCode) candidates.push(directCode);
  for (const child of node?.children?.values?.() || []) {
    const code = applyDrawerSortCodes(child);
    if (code) candidates.push(code);
  }
  for (const child of node?.subconcepts?.values?.() || []) {
    const code = applyDrawerSortCodes(child);
    if (code) candidates.push(code);
  }
  node.descendantSortCode = candidates.length ? candidates.sort(compareAtomSortCodes)[0] : "";
  node.sortCode = node.directSortCode || node.descendantSortCode || "";
  return node.descendantSortCode;
}

function findSuffixTreeNodeByPath(tree, pathParts) {
  const cleanPathParts = Array.isArray(pathParts) ? pathParts.map((part) => text(part)).filter(Boolean) : [];
  let current = tree;
  for (const part of cleanPathParts) {
    if (current?.children?.has?.(part)) {
      current = current.children.get(part);
    } else if (parseSubconceptSegment(part)) {
      const subconcept = parseSubconceptSegment(part);
      current = current?.subconcepts?.get?.(subconcept.label);
    } else {
      current = current?.children?.get?.(part);
    }
    if (!current) return null;
  }
  return current || null;
}

function samePathParts(a, b) {
  const left = Array.isArray(a) ? a.map((part) => text(part)).filter(Boolean) : [];
  const right = Array.isArray(b) ? b.map((part) => text(part)).filter(Boolean) : [];
  if (left.length !== right.length) return false;
  return left.every((part, index) => part === right[index]);
}

function startsWithPathParts(pathParts, prefixParts) {
  const path = Array.isArray(pathParts) ? pathParts.map((part) => text(part)).filter(Boolean) : [];
  const prefix = Array.isArray(prefixParts) ? prefixParts.map((part) => text(part)).filter(Boolean) : [];
  if (prefix.length > path.length) return false;
  return prefix.every((part, index) => path[index] === part);
}

function isValidDrawerSegmentName(value) {
  const textValue = text(value);
  return !!textValue && !/[+\r\n>]/.test(textValue);
}

function buildDrawerRenamePreview(keyword, oldPathParts, newLabel) {
  const baseKeyword = text(keyword?.baseKeyword, keyword?.displayText);
  const cleanOldPathParts = Array.isArray(oldPathParts) ? oldPathParts.map((part) => text(part)).filter(Boolean) : [];
  const cleanNewLabel = text(newLabel);
  if (!baseKeyword) return { ok: false, error: "关键词不存在" };
  if (cleanOldPathParts.length === 0) return { ok: false, error: "请选择一个抽屉节点" };
  if (!isValidDrawerSegmentName(cleanNewLabel)) return { ok: false, error: "抽屉名不能为空，且不能包含 +、> 或换行" };
  const nextPathParts = [...cleanOldPathParts.slice(0, -1), cleanNewLabel];
  const affected = [];
  (keyword.notes || []).forEach((note) => {
    if (text(note.sourceType, keyword.type) !== "yaml") return;
    const suffixParts = splitSuffixParts(note.suffix);
    if (!startsWithPathParts(suffixParts, cleanOldPathParts)) return;
    const nextSuffixParts = [...nextPathParts, ...suffixParts.slice(cleanOldPathParts.length)];
    affected.push({
      note: normalizeKeywordNote(note),
      oldSuffixParts: suffixParts,
      newSuffixParts: nextSuffixParts,
      oldSuffix: buildSuffixFromParts(suffixParts),
      newSuffix: buildSuffixFromParts(nextSuffixParts),
      oldFull: buildKeywordPathText(baseKeyword, suffixParts),
      newFull: buildKeywordPathText(baseKeyword, nextSuffixParts),
    });
  });
  affected.sort((a, b) => compareNoteName(a.note, b.note));
  return {
    ok: true,
    baseKeyword,
    oldPathParts: cleanOldPathParts,
    newPathParts: nextPathParts,
    oldPathText: cleanOldPathParts.join(" + "),
    newPathText: nextPathParts.join(" + "),
    selectedLabel: cleanOldPathParts[cleanOldPathParts.length - 1] || "",
    newLabel: cleanNewLabel,
    affected,
    affectedCount: affected.length,
    affectedFileCount: new Set(affected.map((item) => item.note.path)).size,
  };
}

function compareNoteName(a, b) {
  return text(a?.name).localeCompare(text(b?.name), "zh-CN", { numeric: true, sensitivity: "base" });
}

function compareDrawerNode(a, b) {
  const sortCodeCompare = compareOptionalAtomSortCodes(a?.sortCode, b?.sortCode);
  if (sortCodeCompare) return sortCodeCompare;
  const aBus = parseBusSegment(a?.label);
  const bBus = parseBusSegment(b?.label);
  if (aBus && bBus) return aBus.number - bBus.number || text(aBus.label).localeCompare(text(bBus.label), "zh-CN", { numeric: true, sensitivity: "base" });
  if (aBus) return 1;
  if (bBus) return -1;
  return text(a?.label).localeCompare(text(b?.label), "zh-CN", { numeric: true, sensitivity: "base" });
}

function compareEvaRecordOrder(a, b) {
  const keywordCompare = text(a?._sortKeywordPath, a?.pathLabel).localeCompare(text(b?._sortKeywordPath, b?.pathLabel), "zh-CN", { numeric: true, sensitivity: "base" });
  if (keywordCompare) return keywordCompare;
  const rankCompare = (Number(a?._sortRank) || 0) - (Number(b?._sortRank) || 0);
  if (rankCompare) return rankCompare;
  const sortCodeCompare = compareOptionalAtomSortCodes(a?._sortCode, b?._sortCode);
  if (sortCodeCompare) return sortCodeCompare;
  return text(a?._sortPath, a?.pathLabel).localeCompare(text(b?._sortPath, b?.pathLabel), "zh-CN", { numeric: true, sensitivity: "base" });
}

function stripEvaPrivateSortFields(item) {
  if (!item || typeof item !== "object") return item;
  const { _sortKeywordPath, _sortRank, _sortCode, _sortPath, ...clean } = item;
  return clean;
}

function isMermaidDrawerLabel(label) {
  return /\bmermaid\b/i.test(text(label));
}

function noteNameHasTreeMarker(note) {
  const value = [note?.name, note?.path].map((item) => text(item)).filter(Boolean).join(" ");
  return /[（(]\s*tree\s*[)）]/i.test(value);
}

function notesHaveTreeMarker(notes) {
  return Array.isArray(notes) && notes.some((note) => noteNameHasTreeMarker(note));
}

function drawerNodeHasTreeMarker(node) {
  if (!node) return false;
  if (notesHaveTreeMarker(node.notes)) return true;
  for (const child of node.children?.values?.() || []) {
    if (drawerNodeHasTreeMarker(child)) return true;
  }
  for (const child of node.subconcepts?.values?.() || []) {
    if (drawerNodeHasTreeMarker(child)) return true;
  }
  return false;
}

function keywordHasTreeMarker(keyword) {
  if (!keyword) return false;
  if (notesHaveTreeMarker(keyword.notes)) return true;
  const tree = buildSuffixTree(keyword.notes || []);
  return drawerNodeHasTreeMarker(tree);
}

function buildDrawerStateKey(keywordId, type, pathParts = [], scope = "branch") {
  const safeKeywordId = text(keywordId);
  const safeType = text(type, "mixed");
  const path = Array.isArray(pathParts) && pathParts.length > 0 ? pathParts.map((part) => text(part)).filter(Boolean).join(">") : "__root__";
  return `${safeKeywordId}::${safeType}::${scope}::${path}`;
}

function countTreeNotes(node) {
  if (!node) return 0;
  let count = Array.isArray(node.notes) ? node.notes.length : 0;
  for (const child of node.children?.values?.() || []) count += countTreeNotes(child);
  for (const child of node.subconcepts?.values?.() || []) count += countTreeNotes(child);
  return count;
}

function collectTreeNotes(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node.notes)) node.notes.forEach((note) => out.push(note));
  for (const child of node.children?.values?.() || []) collectTreeNotes(child, out);
  for (const child of node.subconcepts?.values?.() || []) collectTreeNotes(child, out);
  return out;
}

function childrenHaveNoDrawers(node) {
  return (node?.children?.size || 0) === 0 && (node?.subconcepts?.size || 0) === 0;
}

function safeDomIdPart(value) {
  return encodeURIComponent(text(value, "group")).replace(/%/g, "_");
}

function encodeEvaSegment(value) {
  return encodeURIComponent(text(value));
}

function decodeEvaSegment(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_) {
    return text(value);
  }
}

function buildKeywordEvaNodeKey(notePath, scopeType, scopeId, itemId) {
  const segments = [KEYWORD_EVA_VIEW_TYPE, notePath, scopeType, scopeId, itemId].map((value) => text(value));
  if (segments.some((segment) => !segment)) return "";
  return `jump:v1:${segments.map(encodeEvaSegment).join("|")}`;
}

function parseKeywordEvaNodeKey(nodeKey) {
  const raw = text(nodeKey);
  if (!raw.startsWith("jump:v1:")) return null;
  const parts = raw.slice("jump:v1:".length).split("|").map(decodeEvaSegment);
  if (parts.length !== 5) return null;
  const [viewType, notePath, scopeType, scopeId, itemId] = parts;
  if (viewType !== KEYWORD_EVA_VIEW_TYPE || !notePath || !scopeType || !scopeId || !itemId) return null;
  return { viewType, notePath, scopeType, scopeId, itemId };
}

function encodeKeywordDrawerItemId(type, scope, pathParts = []) {
  return [text(type, "mixed"), text(scope, "branch"), ...(pathParts || []).map((part) => text(part)).filter(Boolean)].map(encodeEvaSegment).join("/");
}

function decodeKeywordDrawerItemId(itemId) {
  const parts = text(itemId).split("/").map(decodeEvaSegment);
  return { type: text(parts[0], "mixed"), scope: text(parts[1], "branch"), pathParts: parts.slice(2).filter(Boolean) };
}

class KeywordCommentModal extends Modal {
  constructor(app, plugin, nodeKey) {
    super(app);
    this.plugin = plugin;
    this.nodeKey = nodeKey;
  }

  onOpen() {
    const { contentEl } = this;
    const context = this.plugin.getKeywordCommentContext(this.nodeKey);
    const entry = this.plugin.getKeywordComment(this.nodeKey);
    contentEl.empty();
    contentEl.addClass("kw-keyword-comment-modal");
    contentEl.createEl("h3", { text: "关键词说明" });
    contentEl.createDiv({ cls: "kw-keyword-comment-title", text: context.label || "未命名关键词节点" });
    const meta = contentEl.createDiv({ cls: "kw-keyword-comment-meta" });
    if (context.pathLabel) meta.createSpan({ text: context.pathLabel });
    if (context.nodeKind) meta.createSpan({ text: context.nodeKind });
    if (context.noteCount != null) meta.createSpan({ text: `${context.noteCount} 条目` });

    const commentInput = this.createField(contentEl, "自指说明", "这个关键词是什么意思？适合收什么？和相似关键词怎么区分？", entry.comment);
    const guideInput = this.createField(contentEl, "使用指引", "什么时候用这个关键词？什么时候应该改用另一个关键词？", entry.guide);
    const referencesInput = this.createField(contentEl, "参考关键词", "关于 XX 参考关键词 XX；一行一个提示也可以。", entry.references);

    const actions = contentEl.createDiv({ cls: "kw-keyword-comment-actions" });
    const cancelBtn = actions.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => this.close();
    const evaBtn = actions.createEl("button", { text: "打开 EVA Cross Relations" });
    evaBtn.onclick = async () => {
      await this.saveFromInputs(commentInput, guideInput, referencesInput, context, false);
      this.close();
      await this.plugin.openEvaRelationEditor(this.nodeKey);
    };
    const saveBtn = actions.createEl("button", { text: "保存", cls: "mod-cta" });
    saveBtn.onclick = async () => {
      await this.saveFromInputs(commentInput, guideInput, referencesInput, context, true);
      this.close();
    };
  }

  createField(container, label, placeholder, value) {
    const wrap = container.createDiv({ cls: "kw-keyword-comment-field" });
    wrap.createEl("label", { text: label });
    const input = wrap.createEl("textarea", {
      attr: { placeholder },
    });
    input.value = text(value);
    return input;
  }

  async saveFromInputs(commentInput, guideInput, referencesInput, context, notify) {
    await this.plugin.saveKeywordComment(this.nodeKey, {
      comment: commentInput.value,
      guide: guideInput.value,
      references: referencesInput.value,
      keywordId: context.keywordId,
      label: context.label,
      nodeKind: context.nodeKind,
    });
    if (notify) new Notice("关键词说明已保存");
  }
}

class KeywordRevealChoiceModal extends Modal {
  constructor(app, matches, onChoose) {
    super(app);
    this.matches = Array.isArray(matches) ? matches : [];
    this.onChoose = onChoose;
    this.resolved = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("kw-reveal-choice-modal");
    contentEl.createEl("h3", { text: "选择定位到哪个关键词" });
    const list = contentEl.createDiv({ cls: "kw-reveal-choice-list" });
    this.matches.forEach((match) => {
      const keyword = match?.keyword || {};
      const note = match?.note || {};
      const label = text(keyword.displayText, keyword.baseKeyword, "未命名关键词");
      const suffix = text(note.suffix);
      const sourceType = text(note.sourceType, keyword.type);
      const button = list.createEl("button", { cls: "kw-reveal-choice-item" });
      button.createDiv({ cls: "kw-reveal-choice-title", text: label });
      const meta = [suffix ? `抽屉：${suffix}` : "根部条目", sourceType ? `来源：${sourceType}` : ""].filter(Boolean).join(" · ");
      button.createDiv({ cls: "kw-reveal-choice-meta", text: meta });
      button.onclick = () => {
        this.resolved = true;
        this.close();
        this.onChoose?.(match);
      };
    });
    const actions = contentEl.createDiv({ cls: "kw-reveal-choice-actions" });
    const cancelBtn = actions.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => this.close();
  }

  onClose() {
    if (!this.resolved) this.onChoose?.(null);
  }
}

class KeywordIndexSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Keyword Index Plugin" });

    new Setting(containerEl)
      .setName("Index JSON path")
      .setDesc("Legacy keyword index JSON path. Phase 1 reads it without rewriting.")
      .addText((input) => {
        input.setPlaceholder(DEFAULT_SETTINGS.indexPath);
        input.setValue(this.plugin.settings.indexPath);
        input.onChange(async (value) => {
          this.plugin.settings.indexPath = text(value, DEFAULT_SETTINGS.indexPath);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Scan folder")
      .setDesc("Optional folder for scan preview. Leave blank to preview the whole vault.")
      .addText((input) => {
        input.setPlaceholder("optional/folder");
        input.setValue(this.plugin.settings.scanFolder);
        input.onChange(async (value) => {
          this.plugin.settings.scanFolder = text(value);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Auto sync after note rename")
      .setDesc("When a Markdown note is renamed, rescan keywords and update keyword_index.json after a short debounce.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoSyncOnRename !== false);
        toggle.onChange(async (value) => {
          this.plugin.settings.autoSyncOnRename = value;
          await this.plugin.saveSettings();
        });
      });
  }
}

function normalizeOntologyKeywordLabelKey(value) {
  return text(value).normalize("NFKC").replace(/\s+/g, " ").toLocaleLowerCase();
}

function parseOntologyKeywordLabel(value) {
  const label = text(value);
  const match = label.match(/^([A-Z])(\S[\s\S]*)$/u);
  if (!match) {
    return {
      valid: false,
      label,
      groupLetter: getSortLetter(label),
      displayLabel: label,
      semanticKey: normalizeOntologyKeywordLabelKey(label),
    };
  }
  const displayLabel = text(match[2]);
  return {
    valid: !!displayLabel,
    label,
    groupLetter: match[1],
    displayLabel,
    semanticKey: normalizeOntologyKeywordLabelKey(displayLabel),
  };
}

function toPublicOntologyKeywordRecord(record) {
  const parsed = parseOntologyKeywordLabel(record?.label);
  return Object.assign({}, clone(record, null), {
    groupLetter: parsed.valid ? parsed.groupLetter : text(record?.sortKey, parsed.groupLetter || "#").toUpperCase(),
    displayLabel: parsed.displayLabel,
  });
}

function ontologyKeywordStableStringify(value) {
  const normalize = (entry) => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (!entry || typeof entry !== "object") return entry;
    return Object.keys(entry).sort().reduce((result, key) => {
      if (entry[key] !== undefined && typeof entry[key] !== "function") result[key] = normalize(entry[key]);
      return result;
    }, {});
  };
  return JSON.stringify(normalize(value));
}

function normalizeOntologyKeywordTarget(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Ontology 关键词目标地址无效。");
  const target = {
    addressVersion: text(value.addressVersion, "ontology-owner-ref:v1"),
    targetKind: text(value.targetKind, "owner"),
    providerId: text(value.providerId),
    scopeId: text(value.scopeId),
    familyId: text(value.familyId),
    stableRefVersion: value.stableRefVersion == null ? "" : String(value.stableRefVersion),
    stableRef: clone(value.stableRef, null),
  };
  if (target.addressVersion !== "ontology-owner-ref:v1" || target.targetKind !== "owner") throw new Error("当前只支持 owner 级 Ontology 关键词地址。");
  if (!target.providerId || !target.scopeId || !target.familyId || !target.stableRefVersion || !target.stableRef || typeof target.stableRef !== "object" || Array.isArray(target.stableRef)) throw new Error("Ontology 关键词目标地址字段不完整。");
  return target;
}

function normalizeOntologyKeywordRecord(record, fallbackId = "") {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error(`Ontology 关键词记录无效：${fallbackId}`);
  const id = text(record.id, fallbackId);
  const label = text(record.label);
  const status = text(record.status, "active");
  if (!id || !label || !["active", "deleted", "orphan", "invalid"].includes(status)) throw new Error(`Ontology 关键词记录字段无效：${id || fallbackId}`);
  const target = normalizeOntologyKeywordTarget(record.target || record.targetSnapshot);
  const targetSnapshot = normalizeOntologyKeywordTarget(record.targetSnapshot || target);
  const parsedLabel = parseOntologyKeywordLabel(label);
  const sortKey = parsedLabel.valid
    ? parsedLabel.groupLetter
    : (/^[A-Za-z0-9]$/.test(text(record.sortKey)) ? text(record.sortKey).toUpperCase() : getSortLetter(label));
  return {
    id,
    label,
    labelKey: normalizeOntologyKeywordLabelKey(label),
    sortKey,
    status,
    target,
    targetSnapshot,
    targetLabel: text(record.targetLabel, "未命名 Ontology"),
    targetSourceLabel: text(record.targetSourceLabel, ""),
    createdAt: text(record.createdAt, nowString()),
    updatedAt: text(record.updatedAt, nowString()),
    deletedAt: text(record.deletedAt, ""),
    deletedRevision: Number.isFinite(Number(record.deletedRevision)) ? Number(record.deletedRevision) : null,
    deletedReason: text(record.deletedReason, ""),
  };
}

function normalizeOntologyKeywordIndex(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const keywords = {};
  const reservedIds = new Set(Array.isArray(source.reservedIds) ? source.reservedIds.map((id) => text(id)).filter(Boolean) : []);
  Object.entries(source.keywords && typeof source.keywords === "object" ? source.keywords : {}).forEach(([id, record]) => {
    const normalized = normalizeOntologyKeywordRecord(record, id);
    keywords[normalized.id] = normalized;
    reservedIds.add(normalized.id);
  });
  const activeLabels = new Set();
  Object.values(keywords).forEach((record) => {
    if (record.status === "active") {
      if (activeLabels.has(record.labelKey)) throw new Error(`检测到重复的 Ontology 关键词：${record.label}`);
      activeLabels.add(record.labelKey);
    }
  });
  return {
    version: ONTOLOGY_KEYWORD_INDEX_VERSION,
    revision: Number.isFinite(Number(source.revision)) ? Number(source.revision) : 0,
    reservedIds: Array.from(reservedIds),
    keywords,
  };
}

function createOntologyKeywordId(reservedIds = []) {
  const reserved = new Set(reservedIds);
  let id = "";
  do id = `okw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; while (reserved.has(id));
  return id;
}

class OntologyKeywordRepository {
  constructor(plugin) {
    this.plugin = plugin;
    this.index = normalizeOntologyKeywordIndex({});
    this.lastError = "";
    this.mutationTail = Promise.resolve();
  }

  get indexPath() {
    const configured = text(this.plugin.settings?.indexPath, DEFAULT_SETTINGS.indexPath).replace(/\\/g, "/");
    const slash = configured.lastIndexOf("/");
    return `${slash >= 0 ? configured.slice(0, slash) + "/" : ""}ontology_keyword_index.json`;
  }

  async loadRaw() {
    const exists = await this.plugin.app.vault.adapter.exists(this.indexPath);
    if (!exists) return { exists: false, rawText: "", raw: normalizeOntologyKeywordIndex({}) };
    const rawText = await this.plugin.app.vault.adapter.read(this.indexPath);
    return { exists: true, rawText, raw: normalizeOntologyKeywordIndex(JSON.parse(rawText || "{}")) };
  }

  async load() {
    this.lastError = "";
    try {
      const loaded = await this.loadRaw();
      this.index = loaded.raw;
      return this.index;
    } catch (error) {
      this.lastError = error?.message || String(error);
      this.index = normalizeOntologyKeywordIndex({});
      return this.index;
    }
  }

  list(options = {}) {
    const query = normalizeOntologyKeywordLabelKey(options.query);
    const includeDeleted = options.includeDeleted === true;
    return Object.values(this.index.keywords)
      .filter((record) => includeDeleted || record.status === "active")
      .filter((record) => {
        const parsed = parseOntologyKeywordLabel(record.label);
        return !query || [record.labelKey, parsed.semanticKey, normalizeOntologyKeywordLabelKey(record.targetLabel), normalizeOntologyKeywordLabelKey(record.targetSourceLabel)]
          .some((value) => value.includes(query));
      })
      .sort((left, right) => {
        const leftParsed = parseOntologyKeywordLabel(left.label);
        const rightParsed = parseOntologyKeywordLabel(right.label);
        return left.sortKey.localeCompare(right.sortKey)
          || leftParsed.displayLabel.localeCompare(rightParsed.displayLabel, "zh-CN", { numeric: true, sensitivity: "base" })
          || left.id.localeCompare(right.id);
      })
      .map(toPublicOntologyKeywordRecord);
  }

  listForTarget(target, options = {}) {
    const key = this.targetKey(target);
    return this.list(options).filter((record) => this.targetKey(record.target) === key);
  }

  getRevision() {
    return Number(this.index.revision) || 0;
  }

  getDiagnostics() {
    return {
      contractVersion: ONTOLOGY_KEYWORD_CONTRACT_VERSION,
      indexVersion: ONTOLOGY_KEYWORD_INDEX_VERSION,
      indexPath: this.indexPath,
      revision: this.getRevision(),
      lastError: this.lastError,
      activeCount: this.list().length,
      deletedCount: Object.values(this.index.keywords || {}).filter((record) => record.status === "deleted").length,
      reservedIdCount: Array.isArray(this.index.reservedIds) ? this.index.reservedIds.length : 0,
    };
  }

  targetKey(target) {
    const normalized = normalizeOntologyKeywordTarget(target);
    return ontologyKeywordStableStringify([normalized.providerId, normalized.scopeId, normalized.familyId, normalized.stableRefVersion, normalized.stableRef]);
  }

  async mutate(reason, operation) {
    const task = this.mutationTail.then(async () => {
      const loaded = await this.loadRaw();
      const draft = clone(loaded.raw);
      const result = await operation(draft);
      if (!result?.changed) {
        this.index = draft;
        return Object.assign({ ok: true, revision: draft.revision }, result);
      }
      draft.revision = Number(draft.revision || 0) + 1;
      const content = JSON.stringify(draft, null, 2);
      const txId = `okw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const saved = await this.safeWrite(loaded, content, txId);
      this.index = normalizeOntologyKeywordIndex(JSON.parse(content));
      console.info("[KeywordIndex][ontology-keyword.saved]", { txId, reason, indexPath: this.indexPath, revision: this.index.revision, backupPath: saved.backupPath });
      this.plugin.emitOntologyKeywordChanged?.({ reason, revision: this.index.revision, txId });
      return Object.assign({ ok: true, revision: this.index.revision, backupPath: saved.backupPath }, result);
    });
    this.mutationTail = task.catch(() => {});
    return task;
  }

  async safeWrite(loaded, content, txId) {
    const currentExists = await this.plugin.app.vault.adapter.exists(this.indexPath);
    const currentText = currentExists ? await this.plugin.app.vault.adapter.read(this.indexPath) : "";
    if (currentText !== loaded.rawText) throw new Error("ONTOLOGY_KEYWORD_CONFLICT：关键词索引在编辑期间发生变化，请刷新后重试。");
    const parent = this.indexPath.includes("/") ? this.indexPath.slice(0, this.indexPath.lastIndexOf("/")) : "";
    if (parent && !(await this.plugin.app.vault.adapter.exists(parent))) await this.plugin.app.vault.adapter.mkdir(parent);
    const backupPath = `${this.indexPath}.bak-${timestampForFileName()}-${txId}`;
    const tempPath = `${this.indexPath}.tmp-${txId}`;
    if (currentExists) await this.plugin.app.vault.adapter.write(backupPath, currentText);
    await this.plugin.app.vault.adapter.write(tempPath, content);
    normalizeOntologyKeywordIndex(JSON.parse(await this.plugin.app.vault.adapter.read(tempPath)));
    await this.plugin.app.vault.adapter.write(this.indexPath, await this.plugin.app.vault.adapter.read(tempPath));
    normalizeOntologyKeywordIndex(JSON.parse(await this.plugin.app.vault.adapter.read(this.indexPath)));
    if (await this.plugin.app.vault.adapter.exists(tempPath)) await this.plugin.app.vault.adapter.remove(tempPath);
    return { backupPath: currentExists ? backupPath : "" };
  }

  async create(input = {}) {
    return this.mutate("create", async (draft) => {
      const label = text(input.label);
      const labelKey = normalizeOntologyKeywordLabelKey(label);
      const parsedLabel = parseOntologyKeywordLabel(label);
      const target = normalizeOntologyKeywordTarget(input.target);
      if (!parsedLabel.valid) throw new Error("关键词格式应为一个大写英文字母紧接非空正文，例如：C操作上下文主键汇总。");
      if (Object.values(draft.keywords).some((record) => (
        record.status === "active"
        && parseOntologyKeywordLabel(record.label).semanticKey === parsedLabel.semanticKey
      ))) throw new Error("该关键词正文已经绑定到另一个 Ontology 对象；定位字母不改变关键词身份。");
      const id = createOntologyKeywordId(draft.reservedIds);
      const timestamp = nowString();
      draft.reservedIds.push(id);
      draft.keywords[id] = normalizeOntologyKeywordRecord({
        id,
        label,
        sortKey: parsedLabel.groupLetter,
        status: "active",
        target,
        targetSnapshot: target,
        targetLabel: text(input.targetLabel, "未命名 Ontology"),
        targetSourceLabel: text(input.targetSourceLabel),
        createdAt: timestamp,
        updatedAt: timestamp,
      }, id);
      return { changed: true, keyword: clone(draft.keywords[id], null) };
    });
  }

  async update(idValue, patch = {}) {
    const id = text(idValue);
    return this.mutate("update", async (draft) => {
      const current = draft.keywords[id];
      if (!current || current.status !== "active") throw new Error("关键词不存在或已经删除。");
      if (
        (patch.expectedLabel != null && text(patch.expectedLabel) !== current.label)
        || (patch.expectedUpdatedAt != null && text(patch.expectedUpdatedAt) !== current.updatedAt)
      ) throw new Error("ONTOLOGY_KEYWORD_STALE：关键词已由其他窗口修改，请关闭并重新打开管理窗口。");
      const label = patch.label == null ? current.label : text(patch.label);
      if (label === current.label) return { changed: false, keyword: clone(current, null) };
      const labelKey = normalizeOntologyKeywordLabelKey(label);
      const parsedLabel = parseOntologyKeywordLabel(label);
      if (!parsedLabel.valid) throw new Error("关键词格式应为一个大写英文字母紧接非空正文，例如：C操作上下文主键汇总。");
      if (Object.values(draft.keywords).some((record) => (
        record.id !== id
        && record.status === "active"
        && parseOntologyKeywordLabel(record.label).semanticKey === parsedLabel.semanticKey
      ))) throw new Error("该关键词正文已经绑定到另一个 Ontology 对象；定位字母不改变关键词身份。");
      current.label = label;
      current.labelKey = labelKey;
      current.sortKey = parsedLabel.groupLetter;
      current.updatedAt = nowString();
      return { changed: true, keyword: clone(current, null) };
    });
  }

  async rebind(idValue, target, patch = {}) {
    const id = text(idValue);
    return this.mutate("rebind", async (draft) => {
      const current = draft.keywords[id];
      if (!current || current.status !== "active") throw new Error("关键词不存在或已经删除。");
      const nextTarget = normalizeOntologyKeywordTarget(target);
      const duplicate = Object.values(draft.keywords).find((record) => record.status === "active" && record.id !== id && record.labelKey === current.labelKey);
      if (duplicate && this.targetKey(duplicate.target) !== this.targetKey(nextTarget)) throw new Error("该关键词已经绑定到另一个 Ontology 对象。");
      current.target = nextTarget;
      current.targetSnapshot = clone(nextTarget, null);
      current.targetLabel = text(patch.targetLabel, current.targetLabel);
      current.targetSourceLabel = text(patch.targetSourceLabel, current.targetSourceLabel);
      current.updatedAt = nowString();
      return { changed: true, keyword: clone(current, null) };
    });
  }

  async remove(idValue, reason = "user-unbind") {
    const id = text(idValue);
    return this.mutate("remove", async (draft) => {
      const current = draft.keywords[id];
      if (!current || current.status !== "active") throw new Error("关键词不存在或已经删除。");
      current.status = "deleted";
      current.deletedAt = nowString();
      current.deletedRevision = Number(draft.revision || 0) + 1;
      current.deletedReason = text(reason, "user-unbind");
      current.updatedAt = current.deletedAt;
      current.targetSnapshot = clone(current.target, current.targetSnapshot);
      return { changed: true, keyword: clone(current, null) };
    });
  }
}

class KeywordIndexRepository {
  constructor(plugin) {
    this.plugin = plugin;
    this.index = normalizeLegacyIndex({});
    this.lastError = "";
  }

  get indexPath() {
    return text(this.plugin.settings.indexPath, DEFAULT_SETTINGS.indexPath).replace(/\\/g, "/");
  }

  load(options = {}) {
    const reuseUnchanged = options.reuseUnchanged === true;
    const run = (this.loadQueue || Promise.resolve()).catch(() => {}).then(() => this.readIndex({ reuseUnchanged }));
    this.loadQueue = run;
    return run;
  }

  async readIndex({ reuseUnchanged = false } = {}) {
    this.lastError = "";
    try {
      const requestedPath = this.indexPath;
      const candidatePaths = [requestedPath, DEFAULT_SETTINGS.indexPath, "关键词并行总线改造/keyword_index.json"].filter((value, index, list) => text(value) && list.indexOf(value) === index);
      let resolvedPath = "";
      for (const candidatePath of candidatePaths) {
        if (await this.plugin.app.vault.adapter.exists(candidatePath)) {
          resolvedPath = candidatePath;
          break;
        }
      }
      const exists = Boolean(resolvedPath);
      if (!exists) {
        this.cachedRead = null;
        this.index = normalizeLegacyIndex({});
        this.lastError = `Index file not found: ${candidatePaths.join(" / ")}`;
        return this.index;
      }
      const rawText = await this.plugin.app.vault.adapter.read(resolvedPath);
      if (reuseUnchanged && this.cachedRead?.path === resolvedPath && this.cachedRead.text === rawText && this.cachedRead.index === this.index) {
        if (resolvedPath !== requestedPath) this.lastError = `Using fallback index: ${resolvedPath}`;
        return this.index;
      }
      const raw = JSON.parse(rawText || "{}");
      this.index = normalizeLegacyIndex(raw);
      this.cachedRead = { path: resolvedPath, text: rawText, index: this.index };
      if (resolvedPath !== requestedPath) this.lastError = `Using fallback index: ${resolvedPath}`;
      return this.index;
    } catch (error) {
      this.cachedRead = null;
      this.index = normalizeLegacyIndex({});
      this.lastError = error.message;
      return this.index;
    }
  }

  listKeywords() {
    return Object.values(this.index.keywords || {}).filter((keyword) => keyword.identityStatus !== "unavailable");
  }

  getChildren(parentId) {
    if (this.childrenIndex !== this.index) {
      this.childrenByParent = new Map();
      this.listKeywords().forEach((keyword) => {
        const parent = text(keyword.parentId);
        if (!this.childrenByParent.has(parent)) this.childrenByParent.set(parent, []);
        this.childrenByParent.get(parent).push(keyword);
      });
      this.childrenByParent.forEach((children) => children.sort((a, b) => (a.order - b.order) || compareKeywordByPinyin(a, b)));
      this.childrenIndex = this.index;
    }
    return [...(this.childrenByParent.get(text(parentId)) || [])];
  }

  getStats() {
    const keywords = this.listKeywords();
    const noteCount = keywords.reduce((sum, keyword) => sum + (keyword.notes || []).length, 0);
    return {
      keywordCount: keywords.length,
      topLevelCount: keywords.filter((keyword) => !keyword.parentId).length,
      noteCount,
      indexPath: this.indexPath,
      lastError: this.lastError,
    };
  }
}

// Disposable parsed contributions only. Never a source of permanent keyword identity.
class PersistentKeywordSourceCache {
  constructor(scanner, directory, scope) {
    this.scanner = scanner; this.directory = directory; this.scope = scope;
    this.file = path.join(directory, "scan-source-cache.json"); this.entries = new Map();
    this.fs = require("fs").promises; this.maxBytes = 64 * 1024 * 1024;
  }
  static async open(scanner, configuration) {
    const plugin = scanner.plugin, adapter = plugin.app?.vault?.adapter;
    const base = adapter?.getBasePath?.() || adapter?.basePath;
    const dir = plugin.manifest?.dir;
    if (!scanner.sourceTracking || !base || !dir || !plugin.manifest?.version) return null;
    const fs = require("fs").promises;
    const vault = await fs.realpath(base), directory = await fs.realpath(path.resolve(vault, dir));
    if (!directory.startsWith(vault + path.sep) || vault.startsWith("\\\\")) return null;
    const parser = [scanner.parseSourceContributions, readIdentityYamlValues, parseKeywordWithSuffix, parseYaml].map(fn => String(fn)).join("\n");
    const cache = new PersistentKeywordSourceCache(scanner, directory, {
      version: 1, vault, directory, configuration, pluginVersion: plugin.manifest.version,
      parserHash: cacheDigest(parser), platform: require("process").platform,
    });
    if (!await cache.probeChangeTime()) return null;
    await cache.load(); return cache;
  }
  async probeChangeTime() {
    const probe = path.join(this.directory, ".scan-cache-probe-" + require("crypto").randomBytes(8).toString("hex"));
    let created = false;
    try {
      await this.fs.writeFile(probe, "0", { flag: "wx", mode: 0o600 }); created = true;
      const before = await this.fs.stat(probe, { bigint: true });
      // NTFS can report the same change time for writes within one clock tick.
      await new Promise(resolve => setTimeout(resolve, 20));
      await this.fs.writeFile(probe, "1");
      await this.fs.utimes(probe, Number(before.atimeNs) / 1e9, Number(before.mtimeNs) / 1e9);
      const after = await this.fs.stat(probe, { bigint: true });
      if (typeof before.ctimeNs !== "bigint" || before.ctimeNs <= 0n || after.ctimeNs <= before.ctimeNs
        || before.dev <= 0n || before.ino <= 0n || before.birthtimeNs <= 0n
        || before.dev !== after.dev || before.ino !== after.ino || before.birthtimeNs !== after.birthtimeNs || before.size !== after.size) return false;
      this.scope.device = String(before.dev); return true;
    } catch (_) { return false; }
    finally { if (created) await this.fs.unlink(probe).catch(() => {}); }
  }
  validateEntry(entry) {
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string" || !entry.path
      || entry.path.includes("\\") || entry.path.split("/").some(s => !s || s === "." || s === "..")
      || path.isAbsolute(entry.path) || /^[A-Za-z]:/.test(entry.path) || !/\.md$/i.test(entry.path)
      || typeof entry.basename !== "string" || !Array.isArray(entry.stats) || entry.stats.length !== 3
      || !entry.stats.every(n => typeof n === "number" && Number.isFinite(n) && n >= 0)
      || !Array.isArray(entry.native) || entry.native.length !== 7
      || !entry.native.every(n => typeof n === "string" && /^\d+$/.test(n))
      || [0,1,4,5,6].some(i => BigInt(entry.native[i]) <= 0n)
      || !Array.isArray(entry.contributions) || entry.contributions.length > 10000) return false;
    return entry.contributions.every(p => p && Object.keys(p).every(k => ["baseKeyword", "suffix", "type", "sourceType"].includes(k))
      && typeof p.baseKeyword === "string" && p.baseKeyword.trim().length > 0
      && typeof p.suffix === "string" && ["yaml", "plus"].includes(p.type)
      && ["yaml", "plus", "dot"].includes(p.sourceType));
  }
  async load() {
    try {
      const stat = await this.fs.stat(this.file);
      if (!stat.isFile() || stat.size > this.maxBytes) throw new Error("cache-size");
      const bytes = await this.fs.readFile(this.file);
      if (bytes.length > this.maxBytes) throw new Error("cache-size");
      const envelope = JSON.parse(bytes.toString("utf8")), payload = envelope.payload;
      if (!payload || cacheDigest(JSON.stringify(payload)) !== envelope.sha256
        || JSON.stringify(payload.scope) !== JSON.stringify(this.scope)
        || !Array.isArray(payload.entries) || payload.entries.length > 100000) throw new Error("cache-envelope");
      const entries = new Map();
      for (const entry of payload.entries) {
        if (!this.validateEntry(entry) || entries.has(entry.path)) throw new Error("cache-entry");
        entries.set(entry.path, entry);
      }
      this.entries = entries;
      console.info("[KeywordIndex][scan-cache.loaded]", { entries: entries.size });
    } catch (error) {
      this.entries.clear();
      if (error.code !== "ENOENT") console.warn("[KeywordIndex][scan-cache.ignored]", { reason: error.code || "invalid-cache" });
    }
  }
  async nativeStamp(relative) {
    try {
      const target = path.resolve(this.scope.vault, relative);
      if (!target.startsWith(this.scope.vault + path.sep)) return null;
      const s = await this.fs.stat(target, { bigint: true });
      const fields = [s.dev, s.ino, s.size, s.mode, s.birthtimeNs, s.ctimeNs, s.mtimeNs];
      if (!s.isFile() || String(s.dev) !== this.scope.device || fields.some(n => typeof n !== "bigint" || n < 0n) || [0,1,4,5,6].some(i => fields[i] <= 0n)) return null;
      return fields.map(String);
    } catch (_) { return null; }
  }
  sameNative(a, b) { return !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]); }
  fromStamp(stamp, native, contributions) {
    return { path: stamp.path, basename: stamp.basename, stats: [stamp.ctime, stamp.mtime, stamp.size], native, contributions };
  }
  matches(entry, stamp, native) {
    return entry && entry.path === stamp.path && entry.basename === stamp.basename
      && entry.stats.every((n, i) => n === [stamp.ctime, stamp.mtime, stamp.size][i]) && this.sameNative(entry.native, native);
  }
  async publish(entries, guard) {
    if (entries.length > 100000 || entries.some(e => !this.validateEntry(e))) throw new Error("cache-entry-limit");
    guard();
    const payload = { scope: this.scope, entries }, raw = JSON.stringify({ sha256: cacheDigest(JSON.stringify(payload)), payload });
    if (require("buffer").Buffer.byteLength(raw, "utf8") > this.maxBytes) throw new Error("cache-size-limit");
    const temporary = this.file + ".tmp-" + require("crypto").randomBytes(8).toString("hex");
    try {
      await this.fs.writeFile(temporary, raw, { flag: "wx", mode: 0o600 });
      if (await this.fs.readFile(temporary, "utf8") !== raw) throw new Error("cache-temp-readback");
      guard(); await this.fs.rename(temporary, this.file);
      if (await this.fs.readFile(this.file, "utf8") !== raw) throw new Error("cache-readback");
      console.info("[KeywordIndex][scan-cache.saved]", { entries: entries.length });
    } finally { await this.fs.unlink(temporary).catch(() => {}); }
  }
}
function cacheDigest(raw) { return require("crypto").createHash("sha256").update(raw, "utf8").digest("hex"); }


class KeywordIndexScanner {
  constructor(plugin) {
    this.plugin = plugin;
    this.sourceCache = new Map();
    this.sourceEpochs = new WeakMap();
    this.sourceGeneration = 0;
    this.sourceTracking = false;
    this.sourceProofs = new WeakMap();
    this.persistentMapSnapshots = new WeakMap();
  }

  installSourceTracking() {
    if (this.sourceTracking) return;
    const vault = this.plugin.app.vault;
    if (typeof vault.on !== "function" || typeof this.plugin.registerEvent !== "function") return;
    // Installed before the first scan. Never seed this cache from possibly stale metadata.
    for (const event of ["create", "modify", "delete", "rename"]) {
      this.plugin.registerEvent(vault.on(event, (file, oldPath) => {
        if (!(file instanceof TFile)) {
          this.sourceGeneration += 1; // Folder operations also invalidate in-flight reads.
          this.sourceCache.clear();
          this.persistentCache?.entries.clear();
          return;
        }
        this.sourceEpochs.set(file, (this.sourceEpochs.get(file) || 0) + 1);
        this.sourceCache.delete(file.path);
        if (oldPath) this.sourceCache.delete(oldPath);
        this.persistentCache?.entries.delete(file.path);
        if (oldPath) this.persistentCache?.entries.delete(oldPath);
      }));
    }
    this.sourceTracking = true;
  }

  disposeSourceCache() {
    this.sourceTracking = false;
    this.sourceGeneration += 1;
    this.sourceCache.clear();
    this.sourceEpochs = new WeakMap();
    this.persistentCache?.entries.clear();
  }

  async getPersistentCache() {
    if (!this.sourceTracking || !this.plugin.settings || !this.plugin.manifest?.dir) return null;
    const adapter = this.plugin.app.vault.adapter;
    const currentKey = () => JSON.stringify([this.scanConfiguration(), this.plugin.app.vault.adapter?.getBasePath?.() || this.plugin.app.vault.adapter?.basePath || "", this.plugin.manifest.dir, this.plugin.manifest.version]);
    const key = currentKey();
    if (key !== this.persistentCacheKey) {
      this.persistentCacheKey = key;
      const generation = this.sourceGeneration;
      this.persistentCachePromise = PersistentKeywordSourceCache.open(this, this.scanConfiguration()).then(cache => {
        if (cache && generation !== this.sourceGeneration) cache.entries.clear(); return cache;
      }).catch(error => { console.warn("[KeywordIndex][scan-cache.unavailable]", { reason: error.code || "unsupported" }); return null; });
    }
    const cache = await this.persistentCachePromise;
    if (this.plugin.unloaded || key !== this.persistentCacheKey || key !== currentKey()) return null;
    this.persistentCache = cache; return cache;
  }

  async persistSourceCache(map, guard) {
    try {
      const snapshot = this.persistentMapSnapshots?.get(map);
      if (!snapshot || this.plugin.unloaded) return;
      guard(); await snapshot.cache.publish(snapshot.entries, guard);
    } catch (error) {
      // The index transaction already succeeded. Disposable-cache failure is not business failure.
      console.warn("[KeywordIndex][scan-cache.save-skipped]", { reason: error.code || "cache-write-failed" });
    }
  }

  scanConfiguration() {
    return JSON.stringify([this.plugin.settings.scanFolder || "", this.plugin.settings.indexPath || "", this.plugin.repository?.indexPath || "", 1]);
  }

  sourceStamp(file) {
    const stat = file.stat || {};
    return {
      file, path: file.path, basename: file.basename,
      ctime: stat.ctime, mtime: stat.mtime, size: stat.size,
      epoch: this.sourceEpochs.get(file) || 0, generation: this.sourceGeneration,
      cacheable: this.sourceTracking && [stat.ctime, stat.mtime, stat.size].every(Number.isFinite),
    };
  }

  sameSource(a, b) {
    return ["file", "path", "basename", "ctime", "mtime", "size", "epoch", "generation"].every((key) => a[key] === b[key]);
  }

  assertSourceProof(map, configuration) {
    if (this.plugin.unloaded || this.scanConfiguration() !== configuration) throw new Error("扫描环境已变化，请重新扫描");
    const proof = this.sourceProofs.get(map), files = this.getMarkdownFilesForPreview();
    if (!proof || files.length !== proof.length || files.some((file, i) => !this.sameSource(proof[i], this.sourceStamp(file)))) {
      throw new Error("笔记来源已变化，请重新扫描并对账");
    }
  }

  parseSourceContributions(content, fileName) {
    const contributions = [];
    const add = (value, sourceType) => {
      const parsed = parseKeywordWithSuffix(value);
      if (parsed?.baseKeyword) contributions.push({ ...parsed, sourceType });
    };
    const yamlBody = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || "";
    for (const value of new Set(readIdentityYamlValues(yamlBody))) add(value, "yaml");
    let match;
    const plusRegex = /\+\+(.+?)\+\+/g, dotRegex = /··([^·]+)··/g;
    while ((match = plusRegex.exec(fileName)) !== null) add(match[1], "plus");
    while ((match = dotRegex.exec(fileName)) !== null) add(match[1], "dot");
    return contributions;
  }

  scanSemanticSignature(raw) {
    const comparable = JSON.parse(JSON.stringify(raw));
    if (comparable.identityRegistry) delete comparable.identityRegistry.revision;
    if (comparable.meta) {
      delete comparable.meta.lastScanAt;
      delete comparable.meta.lastScanReason;
    }
    // Strict equality: unknown/manual fields, ordering and scope must all survive.
    return JSON.stringify(comparable);
  }

  async verifyUnchangedOwner(indexPath, rawText, guard) {
    const adapter = this.plugin.app.vault.adapter;
    if (await adapter.exists(indexPath + ".identity-pending.json")) throw new Error("已有未完成身份事务，请先恢复");
    if (await adapter.read(indexPath) !== rawText) throw new Error("索引已被修改，请重新预览");
    guard();
  }

  getMarkdownFilesForPreview() {
    const scanFolder = text(this.plugin.settings.scanFolder).replace(/\\/g, "/");
    const files = this.plugin.app.vault.getMarkdownFiles();
    if (!scanFolder) return files;
    const prefix = scanFolder.endsWith("/") ? scanFolder : `${scanFolder}/`;
    return files.filter((file) => file.path === scanFolder || file.path.startsWith(prefix));
  }

  addToKeywordMap(map, baseKeyword, file, suffix, sourceType) {
    const base = text(baseKeyword);
    if (!base || !file?.path) return;
    if (!map.has(base)) map.set(base, { notes: [], type: sourceType || "yaml", noteKeys: new Set() });
    const entry = map.get(base);
    const cleanSuffix = text(suffix);
    const cleanSourceType = text(sourceType, "yaml");
    const noteKey = `${file.path}::${cleanSuffix}::${cleanSourceType}`;
    if (!entry.noteKeys.has(noteKey)) {
      entry.noteKeys.add(noteKey);
      entry.notes.push({
        path: file.path,
        name: file.basename,
        suffix: cleanSuffix,
        sourceType: cleanSourceType,
      });
    }
    const priority = { dot: 1, plus: 2, yaml: 3 };
    if ((priority[cleanSourceType] || 0) > (priority[entry.type] || 0)) entry.type = cleanSourceType;
  }

  reportProgress(onProgress, progress) {
    try { onProgress?.(progress); } catch (error) {
      console.warn("[KeywordIndex][scan.progress-failed]", error);
    }
  }

  async buildKeywordMap(files, onProgress, { forceRead = false } = {}) {
    const persistent = await this.getPersistentCache();
    if (forceRead) { this.sourceCache.clear(); persistent?.entries.clear(); }
    const persistentEntries = [];
    const keywordMap = new Map();
    const proof = [];
    let readCount = 0, reusedCount = 0;
    let lastYield = Date.now();
    const report = (completed) => this.reportProgress(onProgress, { completed, total: files.length, readCount, reusedCount });
    report(0);
    // Bound retained text and IO; merge in vault order, regardless of read completion order.
    for (let start = 0; start < files.length; start += 8) {
      if (this.plugin.unloaded) throw new Error("插件已卸载，扫描已停止");
      const batch = files.slice(start, start + 8);
      const results = await Promise.allSettled(batch.map(async (file) => {
        const stamp = this.sourceStamp(file), cached = this.sourceCache.get(stamp.path);
        const native = persistent && stamp.cacheable ? await persistent.nativeStamp(stamp.path) : null;
        if (this.plugin.unloaded || !this.sameSource(stamp, this.sourceStamp(file))) throw new Error("笔记来源已变化，请重新扫描并对账");
        if (!forceRead && stamp.cacheable && cached && this.sameSource(cached.stamp, stamp)
          && (!cached.native || persistent?.sameNative(cached.native, native))) {
          reusedCount += 1;
          return { stamp, contributions: cached.contributions, native: cached.native };
        }
        const disk = persistent?.entries.get(stamp.path);
        if (!forceRead && stamp.cacheable && stamp.epoch === 0 && persistent?.matches(disk, stamp, native)) {
          const result = { stamp, contributions: disk.contributions, native };
          this.sourceCache.set(stamp.path, result); reusedCount += 1; return result;
        }
        persistent?.entries.delete(stamp.path);
        this.sourceCache.delete(stamp.path); // A failed fresh/full read must not leave an older proof reusable.
        readCount += 1;
        const content = await this.plugin.app.vault.read(file);
        if (this.plugin.unloaded || !this.sameSource(stamp, this.sourceStamp(file))) throw new Error("笔记来源已变化，请重新扫描并对账");
        const contributions = this.parseSourceContributions(content, text(stamp.basename));
        const afterNative = persistent && native ? await persistent.nativeStamp(stamp.path) : null;
        if (native && !persistent.sameNative(native, afterNative)) throw new Error("读取期间笔记文件已变化，请重新扫描");
        if (this.plugin.unloaded || !this.sameSource(stamp, this.sourceStamp(file))) throw new Error("笔记来源已变化，请重新扫描并对账");
        if (stamp.cacheable) this.sourceCache.set(stamp.path, { stamp, contributions, native: afterNative });
        return { stamp, contributions, native: afterNative };
      }));
      const failure = results.find((result) => result.status === "rejected");
      if (failure) throw failure.reason; // Drain the whole batch before releasing the owner queue.
      for (let offset = 0; offset < batch.length; offset += 1) {
        const { stamp, contributions, native } = results[offset].value;
        if (persistent && native) persistentEntries.push(persistent.fromStamp(stamp, native, contributions));
        proof.push(stamp);
        for (const part of contributions) this.addToKeywordMap(keywordMap, part.baseKeyword, stamp, part.suffix, part.sourceType);
      }
      report(start + batch.length);
      if (Date.now() - lastYield >= 16) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        lastYield = Date.now();
      }
    }
    this.sourceProofs.set(keywordMap, proof);
    if (persistent) this.persistentMapSnapshots.set(keywordMap, { cache: persistent, entries: persistentEntries });
    const paths = new Set(files.map((file) => file.path));
    for (const cachedPath of this.sourceCache.keys()) if (!paths.has(cachedPath)) this.sourceCache.delete(cachedPath);
    return keywordMap;
  }

  preserveStructuralKeyword(oldKeywords, keywords, keywordId, visited = new Set()) {
    const id = text(keywordId);
    if (!id || keywords[id] || visited.has(id)) return false;
    const oldData = oldKeywords[id];
    if (!oldData) return false;
    visited.add(id);
    const baseKeyword = text(oldData.baseKeyword, oldData.displayText);
    if (!baseKeyword) return false;
    const parentId = text(oldData.parentId);
    if (parentId && !keywords[parentId]) this.preserveStructuralKeyword(oldKeywords, keywords, parentId, visited);
    const notes = Array.isArray(oldData.notes) ? oldData.notes : [];
    keywords[id] = Object.assign({}, oldData, {
      id,
      baseKeyword,
      displayText: text(oldData.displayText, getDisplayText(baseKeyword)),
      sortLetter: getSortLetter(baseKeyword),
      notes,
      sortKey: computeSortKey(notes),
      parentId: parentId && keywords[parentId] ? parentId : "",
      order: Number.isFinite(Number(oldData.order)) ? Number(oldData.order) : 0,
    });
    return true;
  }

  buildScannedKeywords(keywordMap, oldKeywords = {}, reservedIds = []) {
    const keywords = {};
    const byLabel = identity.keywordIdsByLabel(oldKeywords);
    const reserved = new Set([...Object.keys(oldKeywords), ...reservedIds]);
    for (const [baseKeyword, info] of keywordMap.entries()) {
      const id = byLabel.get(baseKeyword) || identity.allocate("kw-", reserved);
      const oldData = oldKeywords[id] || {};
      const notes = [...info.notes].sort(compareNoteName);
      keywords[id] = Object.assign({}, oldData, {
        id,
        baseKeyword,
        displayText: text(oldData.displayText, getDisplayText(baseKeyword)),
        sortLetter: getSortLetter(baseKeyword),
        type: info.type,
        notes,
        sortKey: computeSortKey(notes),
        parentId: text(oldData.parentId),
        order: Number.isFinite(Number(oldData.order)) ? Number(oldData.order) : 0,
        identityStatus: "active",
      });
    }
    // Missing content is not evidence of identity deletion or rename.
    for (const [id, oldData] of Object.entries(oldKeywords)) {
      if (!keywords[id]) keywords[id] = Object.assign({}, oldData, { notes: [], identityStatus: "unavailable" });
    }
    // Explicit retained parent links prove structural ancestry, not revived notes.
    for (const child of Object.values(keywords).filter((item) => item.identityStatus === "active")) {
      const seen = new Set([child.id]);
      let parentId = child.parentId;
      while (parentId && keywords[parentId] && !seen.has(parentId)) {
        seen.add(parentId);
        if (keywords[parentId].identityStatus === "unavailable") keywords[parentId] = { ...keywords[parentId], identityStatus: "active", identityStructuralOnly: true };
        parentId = keywords[parentId].parentId;
      }
    }
    let preservedParents = 0;
    Object.values(keywords).forEach((keyword) => {
      if (keyword.parentId && !keywords[keyword.parentId] && this.preserveStructuralKeyword(oldKeywords, keywords, keyword.parentId)) preservedParents += 1;
    });
    let clearedParents = 0;
    Object.values(keywords).forEach((keyword) => {
      if (keyword.parentId && !keywords[keyword.parentId]) {
        keyword.parentId = "";
        clearedParents += 1;
      }
    });
    if (preservedParents || clearedParents) {
      console.info("[KeywordIndex][scan.hierarchy-preserve]", {
        preservedParents,
        clearedParents,
        scannedKeywords: keywordMap.size,
        finalKeywords: Object.keys(keywords).length,
      });
    }
    return keywords;
  }

  async preview() {
    const files = this.getMarkdownFilesForPreview();
    const keywordMap = await this.buildKeywordMap(files);
    const filesWithKeywords = new Set();
    keywordMap.forEach((entry) => entry.notes.forEach((note) => filesWithKeywords.add(note.path)));

    const evaCandidates = [];
    for (const candidatePath of this.plugin.settings.evaNoteCandidatePaths || []) {
      const exists = await this.plugin.app.vault.adapter.exists(candidatePath);
      if (exists) evaCandidates.push(candidatePath);
    }

    return {
      scannedAt: nowString(),
      scanFolder: text(this.plugin.settings.scanFolder, "(whole vault)"),
      fileCount: files.length,
      filesWithKeywords: filesWithKeywords.size,
      keywordCount: keywordMap.size,
      suffixKeywordCount: Array.from(keywordMap.values()).filter((entry) => entry.notes.some((note) => note.suffix)).length,
      evaCandidates,
      topKeywords: Array.from(keywordMap.entries())
        .map(([keyword, info]) => ({ keyword, count: info.notes.length, fileCount: new Set(info.notes.map((note) => note.path)).size, suffixCount: info.notes.filter((note) => note.suffix).length }))
        .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword, "zh-CN"))
        .slice(0, 40),
    };
  }

  async scanAndSave(reason = "manual", onProgress) {
    this.reportProgress(onProgress, { phase: "queued" });
    return this.plugin.withIdentityMutation(() => this.scanAndSaveIdentity(reason, onProgress));
  }

  async scanAndSaveIdentity(reason = "manual", onProgress) {
    const timings = {};
    const configuration = this.scanConfiguration();
    const options = { forceRead: reason === "full" };
    const sourceCounts = {};
    const progress = (phase, counts) => {
      sourceCounts[phase] = counts;
      this.reportProgress(onProgress, { phase, ...counts });
    };
    let phase = "read", started = performance.now();
    const advance = (next) => {
      const now = performance.now();
      timings[phase] = Math.round(now - started);
      phase = next; started = now;
      this.reportProgress(onProgress, { phase });
    };
    const files = this.getMarkdownFilesForPreview();
    const keywordMap = await this.buildKeywordMap(files, (counts) => progress("read", counts), options);
    this.assertSourceProof(keywordMap, configuration);
    advance("reconcile");
    const { indexPath, raw, rawText } = await this.plugin.loadRawIndexForWrite();
    this.plugin.requireIdentityRegistry(raw);
    const beforeSignature = this.scanSemanticSignature(raw);
    const oldKeywords = raw.keywords || {};
    const uiState = this.plugin.buildUiStateMapsForIndex(raw);
    const proposal = await this.plugin.prepareIdentityScan(keywordMap, raw, reason);
    if (!proposal) return { cancelled: true, keywordCount: Object.keys(oldKeywords).length };
    advance("revalidate");
    const refreshedMap = await this.buildKeywordMap(this.getMarkdownFilesForPreview(), (counts) => progress("revalidate", counts), options);
    const sourceGuard = () => this.assertSourceProof(refreshedMap, configuration);
    sourceGuard();
    if (this.plugin.keywordMapSignature(refreshedMap) !== this.plugin.keywordMapSignature(keywordMap)) throw new Error("笔记来源已变化，请重新扫描并对账");
    raw.keywords = proposal.keywords;
    raw.identityRegistry = proposal.registry;
    raw.capsuleExpanded = uiState.capsuleExpanded;
    raw.notesDrawerOpen = uiState.notesDrawerOpen;
    raw.drawerExpanded = uiState.drawerExpanded;
    raw.meta = Object.assign({}, raw.meta || {}, {
      lastScanAt: nowString(),
      lastScanReason: reason,
      scanFolder: text(this.plugin.settings.scanFolder, "(whole vault)"),
      scannedFileCount: files.length,
      keywordCount: Object.keys(raw.keywords).length,
    });
    const txId = `scan_${Date.now().toString(36)}`;
    advance("save");
    this.plugin.validateKeywordIndex(raw);
    const unchanged = this.scanSemanticSignature(raw) === beforeSignature;
    let writeResult;
    if (unchanged) {
      await this.verifyUnchangedOwner(indexPath, rawText, sourceGuard);
      await this.plugin.repository.load();
      await this.verifyUnchangedOwner(indexPath, rawText, sourceGuard);
      // Owner bytes stay untouched, but downstream inventory must still be refreshed/retried.
      writeResult = { published: await this.plugin.publishIdentityChange(txId) };
    } else {
      sourceGuard();
      writeResult = await this.plugin.safeWriteKeywordIndex(indexPath, raw, txId, rawText, sourceGuard);
    }
    advance("refresh");
    await this.plugin.refreshViews();
    // The durable transaction already loads and publishes. Retain the failed-projection retry.
    if (writeResult.published !== true) await this.plugin.publishIdentityChange(`scan:${reason}`);
    await this.persistSourceCache(refreshedMap, sourceGuard);
    advance("complete");
    console.info("[KeywordIndex][scan.timings]", { txId, reason, unchanged, sourceCounts, milliseconds: timings });
    console.info("[KeywordIndex][scan.saved]", { txId, reason, indexPath, backupPath: writeResult.backupPath, files: files.length, keywords: Object.keys(raw.keywords).length });
    return { txId, indexPath, unchanged, backupPath: writeResult.backupPath, fileCount: files.length, keywordCount: Object.keys(raw.keywords).length };
  }
}

class BusQuickCreateModal {
  constructor(app, plugin, scope, onCreated) {
    this.app = app;
    this.plugin = plugin;
    this.scope = scope;
    this.onCreated = onCreated;
    this.overlay = null;
  }

  open() {
    const existing = document.getElementById("kw-bus-create-modal-overlay");
    if (existing) existing.remove();
    const overlay = document.body.createDiv({ cls: "kw-modal-overlay kw-bus-modal-shell", attr: { id: "kw-bus-create-modal-overlay", tabindex: "-1" } });
    const modal = overlay.createDiv({ cls: "kw-modal kw-edit-modal kw-bus-create-modal" });
    modal.addEventListener("click", (event) => event.stopPropagation());
    overlay.onclick = () => this.close();
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
    });
    this.overlay = overlay;
    const header = modal.createDiv({ cls: "kw-modal-header" });
    header.createSpan({ text: `顺延 BUS：${this.scope.latestBusPart}` });
    const closeBtn = header.createEl("button", { text: "×", cls: "kw-edit-modal-close" });
    closeBtn.onclick = () => this.close();
    const contentEl = modal.createDiv({ cls: "kw-edit-modal-body kw-bus-modal" });
    contentEl.createDiv({ cls: "kw-bus-help", text: "该操作会创建新笔记，但不会直接改写 keyword_index.json。创建后请手动扫描/刷新确认。" });

    const busRow = contentEl.createDiv({ cls: "kw-form-row" });
    busRow.createSpan({ cls: "kw-form-label", text: "新 BUS 抽屉名" });
    const busInput = busRow.createEl("input", { type: "text", cls: "kw-form-input", attr: { placeholder: "例如：关于项目" } });

    const noteRow = contentEl.createDiv({ cls: "kw-form-row" });
    noteRow.createSpan({ cls: "kw-form-label", text: "新笔记标题" });
    const noteInput = noteRow.createEl("input", { type: "text", cls: "kw-form-input", attr: { placeholder: "例如：项目拆解第十八版" } });

    const preview = contentEl.createDiv({ cls: "kw-mgr-bus-preview" });
    const renderPreview = () => {
      const busLabel = text(busInput.value);
      const noteTitle = text(noteInput.value);
      const nextBusPart = busLabel
        ? buildBusSegment(this.scope.latestBusNumber + 1, this.scope.latestBusWidth, busLabel)
        : `BUS${String(this.scope.latestBusNumber + 1).padStart(this.scope.latestBusWidth, "0")}.<等待输入抽屉名>`;
      const nextKeywordText = buildKeywordPathText(this.scope.baseKeyword, [...this.scope.prefixParts, nextBusPart]);
      const previewData = this.plugin.previewBusNextNote(this.scope, noteTitle, nextBusPart);
      preview.empty();
      preview.createDiv({ text: `当前作用域：${this.scope.scopeKeywordText}` });
      preview.createDiv({ text: `当前末端 BUS：${this.scope.latestKeywordText}` });
      preview.createDiv({ text: `顺延源笔记：${previewData.sourceFile?.basename || previewData.error || "未找到"}` });
      preview.createDiv({ text: `下一条 BUS：${nextKeywordText}` });
      preview.createDiv({ text: `新笔记预览：${previewData.newCode || "待生成"}${noteTitle ? `- ${noteTitle}` : ""}` });
      if (previewData.newFilePath) preview.createEl("code", { text: previewData.newFilePath });
      if (previewData.error) preview.createDiv({ cls: "kw-bus-error", text: previewData.error });
    };
    busInput.addEventListener("input", renderPreview);
    noteInput.addEventListener("input", renderPreview);
    renderPreview();

    const actions = contentEl.createDiv({ cls: "kw-edit-modal-actions" });
    const cancelBtn = actions.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => this.close();
    const createBtn = actions.createEl("button", { text: "预览确认并创建", cls: "mod-cta" });
    createBtn.onclick = async () => {
      const busLabel = text(busInput.value);
      const noteTitle = text(noteInput.value);
      if (!busLabel) return new Notice("⚠️ 请输入新的 BUS 抽屉名");
      if (busLabel.includes("+")) return new Notice("⚠️ BUS 抽屉名不能包含 + 号");
      if (!noteTitle) return new Notice("⚠️ 请输入新笔记标题");
      const nextBusPart = buildBusSegment(this.scope.latestBusNumber + 1, this.scope.latestBusWidth, busLabel);
      const previewData = this.plugin.previewBusNextNote(this.scope, noteTitle, nextBusPart);
      if (previewData.error) return new Notice(`❌ ${previewData.error}`);
      const ok = await this.confirmCreate(previewData);
      if (!ok) return;
      createBtn.disabled = true;
      createBtn.textContent = "创建中...";
      try {
        const result = await this.plugin.createBusNextNote(this.scope, busLabel, noteTitle);
        new Notice(result.indexPending
          ? `⚠️ 笔记已创建，索引登记未完成。请扫描或恢复身份事务，不要重复创建：${result.file.basename}`
          : `✅ 已创建并保存索引：${result.file.basename}`);
        this.close();
        if (typeof this.onCreated === "function") {
          try { await this.onCreated(result); }
          catch (error) {
            console.warn("[KeywordIndex][bus.create.expand-pending]", { file: result.file.path, error: error.message });
            new Notice("笔记已创建，抽屉展开失败，请重新打开关键词视图。");
          }
        }
      } catch (error) {
        new Notice(`❌ BUS 顺延失败：${error.message}`);
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = "预览确认并创建";
      }
    };
    setTimeout(() => busInput.focus(), 0);
  }

  close() {
    if (this.overlay) this.overlay.remove();
    this.overlay = null;
  }

  confirmCreate(previewData) {
    return new Promise((resolve) => {
      const existing = document.getElementById("kw-bus-confirm-modal-overlay");
      if (existing) existing.remove();
      const overlay = document.body.createDiv({ cls: "kw-modal-overlay kw-bus-confirm-overlay", attr: { id: "kw-bus-confirm-modal-overlay", tabindex: "-1" } });
      const modal = overlay.createDiv({ cls: "kw-modal kw-edit-modal kw-bus-confirm-modal" });
      modal.addEventListener("click", (event) => event.stopPropagation());
      const close = (result) => {
        overlay.remove();
        resolve(result);
      };
      overlay.onclick = () => close(false);
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close(false);
        }
      });
      const header = modal.createDiv({ cls: "kw-modal-header" });
      header.createSpan({ text: "确认创建 BUS 顺延笔记" });
      const closeBtn = header.createEl("button", { text: "×", cls: "kw-edit-modal-close" });
      closeBtn.onclick = () => close(false);
      const body = modal.createDiv({ cls: "kw-edit-modal-body" });
      body.createDiv({ cls: "kw-edit-modal-tip", text: "确认后会创建一个新的 Markdown 笔记，并只更新当前插件视图内存索引；不会改写 keyword_index.json。" });
      const preview = body.createDiv({ cls: "kw-mgr-bus-preview" });
      preview.createDiv({ text: `目标文件：${previewData.newFilePath}` });
      preview.createDiv({ text: `关键词：${previewData.nextKeywordText}` });
      preview.createDiv({ text: `顺延源笔记：${previewData.sourceFile?.basename || "未找到"}` });
      const actions = body.createDiv({ cls: "kw-edit-modal-actions" });
      const cancelBtn = actions.createEl("button", { text: "取消" });
      cancelBtn.onclick = () => close(false);
      const okBtn = actions.createEl("button", { text: "确认创建", cls: "mod-cta" });
      okBtn.onclick = () => close(true);
      setTimeout(() => okBtn.focus(), 0);
    });
  }
}

class KeywordIndexView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.closed = false;
    this.scanPreview = null;
    this.query = "";
    this.collapsedIds = new Set(Object.entries(this.plugin.settings.uiState?.capsuleExpanded || {}).filter(([, expanded]) => expanded === false).map(([id]) => id));
    this.notesOpenIds = new Set(Object.entries(this.plugin.settings.uiState?.notesDrawerOpen || {}).filter(([, open]) => open === true).map(([id]) => id));
    this.drawerExpanded = Object.assign({}, this.plugin.settings.uiState?.drawerExpanded || {});
    this.preferredKeywordViewMode = normalizeKeywordViewMode(this.plugin.settings.uiState?.keywordViewMode);
    this.effectiveKeywordViewMode = this.preferredKeywordViewMode;
    this.displayKeywordsById = this.plugin.repository?.index?.keywords || {};
    this.displayChildrenByParentId = null;
    this.dialogueProjectionStats = null;
    this.floatingTocCleanup = null;
    this.floatingTocFrame = null;
    this.reviewMetaOverlayFrame = null;
    this.boldRefPopover = null;
    this.boldRefPopoverCloseTimer = null;
    this.dialogueIndexedNotePaths = new Set();
    this.dialogueMetadataRefreshTimer = null;
    this.dialogueMetadataRefreshFrame = null;
    this.dialogueMetadataRefreshGeneration = 0;
  }

  getViewType() {
    return VIEW_TYPE_KEYWORD_INDEX;
  }

  getDisplayText() {
    return "Keyword Index";
  }

  getIcon() {
    return "tags";
  }

  async onOpen() {
    this.contentEl.addClass("keyword-index-plugin-view");
    this.registerEvent(this.plugin.app.metadataCache.on("changed", (file) => {
      this.scheduleSymbolDialogueMetadataRefresh(file);
    }));
    this.registerEvent(this.plugin.app.metadataCache.on("resolved", () => {
      this.scheduleSymbolDialogueProjectionRefresh("metadata-resolved");
    }));
    if (!this.plugin.deferredRevealLeaves?.has(this.leaf)) await this.refresh({ reload: true });
  }

  onClose() {
    this.closed = true;
    this.plugin.navigationGeneration = (this.plugin.navigationGeneration || 0) + 1;
    this.nodeTargets = this.keywordTargets = null;
    this.renderedIndex = null;
    this.clearSymbolDialogueMetadataRefresh();
    this.dialogueIndexedNotePaths.clear();
    this.cleanupFloatingLetterTocTracker();
    this.cleanupReviewMetaOverlays();
    this.closeBoldRefPopover();
  }

  async refresh(options = {}) {
    if (options.reload) await this.plugin.repository.load();
    if (!this.closed) this.render();
  }

  persistUiStateSoon() {
    this.plugin.persistUiStateFromView(this);
  }

  isSymbolDialogueMode() {
    return this.effectiveKeywordViewMode === KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE;
  }

  setPreferredKeywordViewMode(mode) {
    const normalized = normalizeKeywordViewMode(mode);
    this.preferredKeywordViewMode = normalized;
    this.effectiveKeywordViewMode = normalized;
    if (normalized !== KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE) {
      this.clearSymbolDialogueMetadataRefresh();
      this.dialogueIndexedNotePaths.clear();
    }
    if (normalized === KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE) this.scanPreview = null;
    this.persistUiStateSoon();
  }

  clearSymbolDialogueMetadataRefresh() {
    this.dialogueMetadataRefreshGeneration += 1;
    if (this.dialogueMetadataRefreshTimer !== null) {
      window.clearTimeout(this.dialogueMetadataRefreshTimer);
      this.dialogueMetadataRefreshTimer = null;
    }
    if (this.dialogueMetadataRefreshFrame !== null) {
      window.cancelAnimationFrame(this.dialogueMetadataRefreshFrame);
      this.dialogueMetadataRefreshFrame = null;
    }
  }

  scheduleSymbolDialogueProjectionRefresh(reason = "metadata-refresh") {
    if (!this.isSymbolDialogueMode()) return false;
    this.clearSymbolDialogueMetadataRefresh();
    const generation = this.dialogueMetadataRefreshGeneration;
    this.dialogueMetadataRefreshTimer = window.setTimeout(() => {
      this.dialogueMetadataRefreshTimer = null;
      if (!this.isSymbolDialogueMode()) return;
      const scrollContainer = this.getScrollContainer(this.contentEl);
      const previousScrollTop = Number(scrollContainer?.scrollTop || 0);
      const scrollContainerBelongsToView = Boolean(scrollContainer
        && scrollContainer !== document.scrollingElement
        && scrollContainer !== document.documentElement
        && scrollContainer !== document.body
        && scrollContainer.isConnected
        && (scrollContainer === this.contentEl || scrollContainer.contains(this.contentEl) || this.contentEl.contains(scrollContainer)));
      this.render();
      this.dialogueMetadataRefreshFrame = window.requestAnimationFrame(() => {
        this.dialogueMetadataRefreshFrame = null;
        if (generation !== this.dialogueMetadataRefreshGeneration || !this.isSymbolDialogueMode()) return;
        const scrollContainerStable = Boolean(scrollContainerBelongsToView
          && scrollContainer.isConnected
          && (scrollContainer === this.contentEl || scrollContainer.contains(this.contentEl) || this.contentEl.contains(scrollContainer)));
        if (scrollContainerStable && Number.isFinite(previousScrollTop)) scrollContainer.scrollTop = previousScrollTop;
        console.info("[KeywordIndex][symbol-dialogue.metadata-refresh]", {
          reason: text(reason, "metadata-refresh"),
          indexedNotePathCount: this.dialogueIndexedNotePaths.size,
          projectionStats: this.dialogueProjectionStats || null,
          previousScrollTop: Math.round(previousScrollTop),
          restoredScrollTop: scrollContainerStable ? Math.round(scrollContainer.scrollTop) : null,
          scrollContainerStable,
        });
      });
    }, 120);
    return true;
  }

  scheduleSymbolDialogueMetadataRefresh(file) {
    if (!this.isSymbolDialogueMode()) return false;
    if (!(file instanceof TFile) || file.extension !== "md") return false;
    const notePath = text(file.path);
    if (!notePath || !this.dialogueIndexedNotePaths.has(notePath)) return false;
    return this.scheduleSymbolDialogueProjectionRefresh("metadata-changed");
  }

  useFullModeForExternalReveal(reason = "external-reveal") {
    if (!this.isSymbolDialogueMode()) return false;
    this.effectiveKeywordViewMode = KEYWORD_VIEW_MODE_ALL;
    this.clearSymbolDialogueMetadataRefresh();
    this.dialogueIndexedNotePaths.clear();
    this.displayKeywordsById = this.plugin.repository.index.keywords || {};
    this.displayChildrenByParentId = null;
    this.dialogueProjectionStats = null;
    console.info("[KeywordIndex][symbol-dialogue.reveal-full-session]", {
      reason: text(reason),
      preferredMode: this.preferredKeywordViewMode,
    });
    return true;
  }

  buildSymbolDialogueProjection() {
    const sourceKeywordsById = this.plugin.repository.index.keywords || {};
    const indexedNotePaths = new Set();
    const qualificationByPath = new Map();
    const isQualifiedPath = (rawPath) => {
      const notePath = text(rawPath);
      if (!notePath) return false;
      if (qualificationByPath.has(notePath)) return qualificationByPath.get(notePath);
      const file = this.plugin.app.vault.getAbstractFileByPath(notePath);
      const qualified = file instanceof TFile
        && this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.["符号对话"] === true;
      qualificationByPath.set(notePath, qualified);
      return qualified;
    };
    const allClonesById = {};
    const directHitIds = new Set();
    let seedRegistrationCount = 0;
    Object.values(sourceKeywordsById).forEach((keyword) => {
      const notesByType = new Map();
      const seedPathsByType = new Map();
      for (const note of keyword.notes || []) {
        const notePath = text(note.path);
        if (notePath) indexedNotePaths.add(notePath);
        const sourceType = text(note.sourceType, keyword.type || "yaml");
        if (!notesByType.has(sourceType)) notesByType.set(sourceType, []);
        notesByType.get(sourceType).push(note);
        if (!isQualifiedPath(note.path)) continue;
        if (!seedPathsByType.has(sourceType)) seedPathsByType.set(sourceType, []);
        seedPathsByType.get(sourceType).push(splitSuffixParts(note.suffix));
        seedRegistrationCount += 1;
      }
      const dialogueProjectedTreesByType = {};
      const projectedNotes = [];
      const projectedNoteIds = new Set();
      for (const [sourceType, seedPaths] of seedPathsByType.entries()) {
        const projectedTree = projectSuffixTree(buildSuffixTree(notesByType.get(sourceType) || []), seedPaths);
        if (!suffixTreeHasContent(projectedTree)) continue;
        dialogueProjectedTreesByType[sourceType] = projectedTree;
        collectSuffixTreeNotes(projectedTree, sourceType, projectedNotes, projectedNoteIds);
      }
      const cloneKeyword = Object.assign({}, keyword, {
        notes: projectedNotes,
        dialogueProjectedTreesByType,
      });
      allClonesById[cloneKeyword.id] = cloneKeyword;
      if (seedPathsByType.size > 0) directHitIds.add(cloneKeyword.id);
    });
    const branchIds = new Set(directHitIds);
    directHitIds.forEach((keywordId) => {
      let parentId = text(sourceKeywordsById[keywordId]?.parentId);
      while (parentId && sourceKeywordsById[parentId] && !branchIds.has(parentId)) {
        branchIds.add(parentId);
        parentId = text(sourceKeywordsById[parentId].parentId);
      }
    });
    const keywordsById = {};
    const keywords = Object.values(sourceKeywordsById)
      .filter((keyword) => branchIds.has(keyword.id))
      .map((keyword) => {
        const projected = allClonesById[keyword.id];
        keywordsById[projected.id] = projected;
        return projected;
      });
    const childrenByParentId = new Map();
    keywords.forEach((keyword) => {
      const parentId = text(keyword.parentId);
      if (!childrenByParentId.has(parentId)) childrenByParentId.set(parentId, []);
      childrenByParentId.get(parentId).push(keyword);
    });
    childrenByParentId.forEach((children) => children.sort((a, b) => (a.order - b.order) || compareKeywordByPinyin(a, b)));
    this.dialogueIndexedNotePaths = indexedNotePaths;
    return {
      keywords,
      keywordsById,
      childrenByParentId,
      branchIds,
      stats: {
        qualifyingRegistrationCount: keywords.reduce((sum, keyword) => sum + (keyword.notes || []).length, 0),
        seedRegistrationCount,
        qualifyingPathCount: Array.from(qualificationByPath.values()).filter(Boolean).length,
        metadataLookupCount: qualificationByPath.size,
      },
    };
  }

  prepareDisplayProjection() {
    if (!this.isSymbolDialogueMode()) {
      this.displayKeywordsById = this.plugin.repository.index.keywords || {};
      this.displayChildrenByParentId = null;
      this.dialogueProjectionStats = null;
      return this.plugin.repository.listKeywords();
    }
    const projection = this.buildSymbolDialogueProjection();
    this.displayKeywordsById = projection.keywordsById;
    this.displayChildrenByParentId = projection.childrenByParentId;
    this.dialogueProjectionStats = projection.stats;
    return projection.keywords;
  }

  displaySignature() {
    return JSON.stringify([this.effectiveKeywordViewMode, this.query, [...this.collapsedIds].sort(), [...this.notesOpenIds].sort(), Object.entries(this.drawerExpanded).sort(([a], [b]) => a.localeCompare(b))]);
  }

  indexRenderedTargets() {
    this.nodeTargets = new Map(); this.keywordTargets = new Map();
    for (const element of this.contentEl.querySelectorAll('[data-eva-node-key], [data-keyword-primary-anchor]')) {
      if (element.dataset.evaNodeKey) {
        const key = element.dataset.evaNodeKey;
        if (!this.nodeTargets.has(key)) this.nodeTargets.set(key, []);
        this.nodeTargets.get(key).push(element);
      }
      if (element.dataset.keywordPrimaryAnchor === 'true' && element.dataset.keywordId && !this.keywordTargets.has(element.dataset.keywordId)) this.keywordTargets.set(element.dataset.keywordId, element);
    }
  }

  findRevealTarget(nodeKey, keywordId = '') {
    const valid = (element) => element?.isConnected && this.contentEl.contains(element) && element.getClientRects().length > 0;
    if (keywordId) { const target = this.keywordTargets?.get(text(keywordId)); return valid(target) ? target : null; }
    const targets = this.nodeTargets?.get(nodeKey) || [];
    return targets.find((element) => element.dataset.keywordPrimaryAnchor === 'true' && valid(element)) || targets.find(valid) || null;
  }

  revealEvaNode(nodeKey, behavior = 'smooth') {
    const target = this.findRevealTarget(nodeKey);
    if (!target) { console.warn('[KeywordIndex][eva.reveal-miss]', { nodeKey }); return false; }
    target.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
    target.addClass?.('is-eva-reveal-target');
    window.setTimeout(() => target.removeClass?.('is-eva-reveal-target'), 1800);
    console.info('[KeywordIndex][eva.reveal]', { nodeKey });
    return true;
  }

  getVisibleChildren(parentId) {
    const children = this.isSymbolDialogueMode()
      ? [...(this.displayChildrenByParentId?.get(text(parentId)) || [])]
      : this.plugin.repository.getChildren(parentId);
    if (!this.query) return children;
    const keywordsById = this.displayKeywordsById || this.plugin.repository.index.keywords || {};
    return children.filter((child) => {
      let cursor = child;
      while (cursor) {
        if (this.visibleKeywordIds?.has?.(cursor.id)) return true;
        cursor = keywordsById[text(cursor.parentId)];
      }
      return false;
    });
  }

  getScrollContainer(anchor) {
    let current = anchor;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY || "");
      if (canScrollY && current.scrollHeight > current.clientHeight + 8) return current;
      current = current.parentElement;
    }
    return this.contentEl.closest(".view-content") || document.scrollingElement || document.documentElement;
  }

  cleanupFloatingLetterTocTracker() {
    if (typeof this.floatingTocCleanup === "function") {
      this.floatingTocCleanup();
      this.floatingTocCleanup = null;
    }
    if (this.floatingTocFrame) {
      window.cancelAnimationFrame(this.floatingTocFrame);
      this.floatingTocFrame = null;
    }
  }

  trackFloatingLetterToc(wrap, toc, grouped) {
    this.cleanupFloatingLetterTocTracker();
    if (!toc || !Array.isArray(grouped) || grouped.length <= 1) return;
    const entries = grouped
      .map(([letter]) => ({
        letter,
        target: wrap.querySelector(`#kw-group-${safeDomIdPart(letter)}`),
        link: Array.from(toc.querySelectorAll(".kw-floating-letter-toc-link")).find((link) => link.dataset.letter === letter),
      }))
      .filter((entry) => entry.target && entry.link);
    if (!entries.length) return;
    const indicator = toc.querySelector(".kw-floating-letter-toc-current");
    const scrollContainer = this.getScrollContainer(entries[0].target);
    const updateActiveLetter = () => {
      this.floatingTocFrame = null;
      const containerRect = scrollContainer.getBoundingClientRect();
      const anchorY = containerRect.top + Math.min(Math.max(containerRect.height * 0.28, 72), 180);
      let active = entries[0];
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        if (rect.top <= anchorY) active = entry;
        else break;
      }
      entries.forEach((entry) => {
        const isActive = entry === active;
        entry.link.classList.toggle("is-active", isActive);
        entry.link.setAttribute("aria-current", isActive ? "true" : "false");
      });
      if (indicator) indicator.textContent = active.letter;
    };
    const scheduleUpdate = () => {
      if (this.floatingTocFrame) return;
      this.floatingTocFrame = window.requestAnimationFrame(updateActiveLetter);
    };
    scrollContainer.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    this.floatingTocCleanup = () => {
      scrollContainer.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
    scheduleUpdate();
  }

  scrollGroupHeaderIntoView(target, letter) {
    if (!target) return false;
    const scrollContainer = this.getScrollContainer(target);
    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = 12;
    const nextTop = Math.max(0, scrollContainer.scrollTop + targetRect.top - containerRect.top - offset);
    scrollContainer.scrollTo({ top: nextTop, behavior: "smooth" });
    target.addClass?.("is-letter-reveal-target");
    window.setTimeout(() => target.removeClass?.("is-letter-reveal-target"), 1200);
    console.info("[KeywordIndex][letter-nav.scroll]", {
      letter,
      targetId: target.id,
      nextTop: Math.round(nextTop),
      containerClass: scrollContainer.className || scrollContainer.tagName,
    });
    return true;
  }

  render() {
    if (this.closed) return;
    this.renderedIndex = null;
    const { contentEl } = this;
    if (!this.isSymbolDialogueMode()) {
      this.clearSymbolDialogueMetadataRefresh();
      this.dialogueIndexedNotePaths.clear();
    }
    this.closeBoldRefPopover();
    this.cleanupReviewMetaOverlays();
    this.keywordRefLookup = null;
    this.boldKeywordReferenceIndex = null;
    contentEl.empty();
    contentEl.addClass("kw-container");
    const wrap = contentEl.createDiv({ cls: "kw-container" });
    wrap.classList.toggle("is-symbol-dialogue-mode", this.isSymbolDialogueMode());
    this.renderLegend(wrap);
    this.renderToolbar(wrap);
    if (!this.isSymbolDialogueMode() && this.scanPreview) this.renderScanPreview(wrap);
    this.renderDisplayView(wrap);
    this.scheduleReviewMetaOverlayRefresh();
    this.indexRenderedTargets();
    this.renderedIndex = this.plugin.repository.index;
    this.renderedSignature = this.displaySignature();
    this.renderedScanPreview = this.scanPreview;
    this.renderedComments = this.plugin.settings.keywordComments;
  }

  cleanupReviewMetaOverlays() {
    if (this.reviewMetaOverlayFrame) {
      window.cancelAnimationFrame(this.reviewMetaOverlayFrame);
      this.reviewMetaOverlayFrame = null;
    }
    this.contentEl.querySelectorAll(".kw-review-meta-badge").forEach((badge) => badge.remove());
    this.contentEl.querySelectorAll(".is-review-meta-hit").forEach((anchor) => {
      anchor.classList.remove("is-review-meta-hit");
      if (Object.prototype.hasOwnProperty.call(anchor.dataset, "reviewMetaOriginalTitle")) {
        const originalTitle = anchor.dataset.reviewMetaOriginalTitle || "";
        if (originalTitle) anchor.setAttribute("title", originalTitle);
        else anchor.removeAttribute("title");
        delete anchor.dataset.reviewMetaOriginalTitle;
      }
    });
  }

  scheduleReviewMetaOverlayRefresh() {
    if (this.reviewMetaOverlayFrame) window.cancelAnimationFrame(this.reviewMetaOverlayFrame);
    this.reviewMetaOverlayFrame = window.requestAnimationFrame(() => {
      this.reviewMetaOverlayFrame = null;
      this.refreshReviewMetaOverlays();
    });
  }

  refreshReviewMetaOverlays() {
    this.cleanupReviewMetaOverlays();
    if (!this.plugin.isDailyReviewMetaActive()) return;
    const snapshot = this.plugin.getDailyReviewMetaSnapshot();
    const nodeMap = snapshot?.nodeMap || {};
    if (!snapshot || !Object.keys(nodeMap).length) return;

    let marked = 0;
    let skipped = 0;
    const anchors = Array.from(this.contentEl.querySelectorAll("[data-eva-node-key]"));
    for (const anchor of anchors) {
      const nodeKey = text(anchor.dataset.evaNodeKey);
      if (!nodeKey) {
        skipped += 1;
        continue;
      }
      const hit = nodeMap[nodeKey];
      if (!hit) continue;
      anchor.classList.add("is-review-meta-hit");
      if (!Object.prototype.hasOwnProperty.call(anchor.dataset, "reviewMetaOriginalTitle")) {
        anchor.dataset.reviewMetaOriginalTitle = anchor.getAttribute("title") || "";
      }
      const sourceLabels = Array.isArray(hit.sourceLabels) ? hit.sourceLabels.filter(Boolean) : [];
      const sourceKindText = [
        hit.sourceKinds?.direct ? `直接 ${hit.sourceKinds.direct}` : "",
        hit.sourceKinds?.inherited ? `继承 ${hit.sourceKinds.inherited}` : "",
      ].filter(Boolean).join(" / ");
      const tooltip = [
        `Review Meta：近 ${snapshot.days} 天触达`,
        `${hit.noteCount || 0} 条近期 note，${hit.dayCount || 0} 天`,
        hit.aggregate && !hit.exact ? "这是下属抽屉汇总到关键词胶囊的近期数。" : "",
        hit.aggregate && hit.exact ? "包含关键词本身命中与下属抽屉汇总。" : "",
        "这是近期回看触达数，不是蓝色的关键词索引收纳总数。",
        hit.latestDateKey ? `最近：${hit.latestDateKey}` : "",
        sourceKindText ? `来源：${sourceKindText}` : "",
        sourceLabels.length ? sourceLabels.slice(0, 4).join("；") : "",
      ].filter(Boolean).join("\n");
      const originalTitle = anchor.dataset.reviewMetaOriginalTitle || "";
      anchor.setAttribute("title", [originalTitle, tooltip].filter(Boolean).join("\n\n"));
      const badge = document.createElement("span");
      badge.className = "kw-review-meta-badge";
      const inheritedOnly = !!hit.sourceKinds?.inherited && !hit.sourceKinds?.direct;
      badge.textContent = `近${inheritedOnly ? "↑" : ""}${hit.noteCount || ""}`;
      badge.setAttribute("aria-label", tooltip);
      anchor.appendChild(badge);
      marked += 1;
    }
    console.debug("[KeywordIndex][review-meta.overlay]", {
      marked,
      skipped,
      days: snapshot.days,
      keywordCount: snapshot.keywords?.length || 0,
    });
  }

  renderLegend(wrap) {
    const legend = wrap.createDiv({ cls: "kw-legend" });
    ["yaml", "plus", "dot"].forEach((type) => {
      const color = SOURCE_COLORS[type];
      const item = legend.createSpan({ cls: `kw-legend-item kw-legend-${type}` });
      item.createSpan({ text: color.icon });
      item.createSpan({ text: color.label });
    });
  }

  renderToolbar(wrap) {
    const toolbar = wrap.createDiv({ cls: "kw-toolbar" });
    const dialogueMode = this.isSymbolDialogueMode();
    const reloadBtn = toolbar.createEl("button", { text: "重新读取索引", cls: "secondary" });
    reloadBtn.onclick = async () => {
      await this.refresh({ reload: true });
      new Notice("Keyword index reloaded.");
    };

    const dialogueBtn = toolbar.createEl("button", {
      text: "💬 符号对话",
      cls: `secondary kw-symbol-dialogue-toggle${dialogueMode ? " is-active" : ""}`,
      attr: { "aria-pressed": dialogueMode ? "true" : "false" },
    });
    dialogueBtn.title = dialogueMode ? "返回完整关键词网络" : "仅显示 frontmatter 为“符号对话: true”的关联笔记";
    dialogueBtn.onclick = () => {
      this.setPreferredKeywordViewMode(dialogueMode ? KEYWORD_VIEW_MODE_ALL : KEYWORD_VIEW_MODE_SYMBOL_DIALOGUE);
      this.render();
    };

    if (!dialogueMode) {
      const scanBtn = toolbar.createEl("button", { text: "🔄 扫描关键词" });
      scanBtn.onclick = async () => {
        scanBtn.disabled = true;
        scanBtn.textContent = "写入中...";
        try {
          await this.plugin.runManualKeywordScan("toolbar");
        } finally {
          scanBtn.disabled = false;
          scanBtn.textContent = "🔄 扫描关键词";
        }
      };

      const scanPreviewBtn = toolbar.createEl("button", { text: "👁️ 扫描预览", cls: "secondary" });
      scanPreviewBtn.onclick = async () => {
        scanPreviewBtn.disabled = true;
        scanPreviewBtn.textContent = "扫描中...";
        try {
          this.scanPreview = await this.plugin.scanner.preview();
          this.render();
        } catch (error) {
          new Notice(`Scan preview failed: ${error.message}`);
        } finally {
          scanPreviewBtn.disabled = false;
          scanPreviewBtn.textContent = "👁️ 扫描预览";
        }
      };
    }

    const collapseAllBtn = toolbar.createEl("button", { text: "📁 全部折叠", cls: "secondary" });
    collapseAllBtn.onclick = () => {
      this.plugin.repository.listKeywords().forEach((keyword) => this.collapsedIds.add(keyword.id));
      this.notesOpenIds.clear();
      this.render();
    };

    const expandAllBtn = toolbar.createEl("button", { text: "📂 全部展开", cls: "secondary" });
    expandAllBtn.onclick = () => {
      this.collapsedIds.clear();
      this.render();
    };

    if (!dialogueMode) {
      const managerBtn = toolbar.createEl("button", { text: "⚙️ 管理关键词", cls: "secondary" });
      managerBtn.title = "打开快速定位关键词并编辑。当前仅修改插件内存视图，不写 keyword_index.json。";
      managerBtn.onclick = () => this.openQuickKeywordEditor();
    }

    const stats = this.plugin.repository.getStats();
    toolbar.createSpan({ cls: "kw-readonly-badge", text: "只读插件预览" });
    toolbar.createSpan({ cls: "kw-readonly-meta", text: `索引：${stats.indexPath}` });
    if (stats.lastError) toolbar.createSpan({ cls: "kw-readonly-warning", text: stats.lastError });

    const search = toolbar.createEl("input", { type: "search", cls: "kw-search-input", attr: { placeholder: "搜索关键词..." } });
    search.value = this.query;
    search.oninput = () => {
      this.query = text(search.value).toLowerCase();
      this.render();
    };
  }

  renderScanPreview(wrap) {
    const preview = this.scanPreview;
    const panel = wrap.createDiv({ cls: "kw-scan-preview" });
    panel.createEl("h3", { text: "扫描预览（只读）" });
    panel.createEl("div", { text: `范围：${preview.scanFolder}；扫描 ${preview.fileCount} 个 md，命中 ${preview.filesWithKeywords} 个文件，识别 ${preview.keywordCount} 个关键词。` });
    if (preview.evaCandidates.length) {
      panel.createEl("div", { text: `识别到 EVA 候选：${preview.evaCandidates.join("、")}` });
    }
    const list = panel.createEl("ol");
    preview.topKeywords.slice(0, 12).forEach((item) => {
      list.createEl("li", { text: `${item.keyword}：${item.count} 次 / ${item.fileCount} 文件 / suffix ${item.suffixCount}` });
    });
  }

  openQuickKeywordEditor() {
    const keywords = this.plugin.repository.listKeywords();
    const overlay = document.body.createDiv({ cls: "kw-modal-overlay kw-quick-edit-overlay", attr: { tabindex: "-1" } });
    const modal = overlay.createDiv({ cls: "kw-modal kw-edit-modal kw-quick-edit-modal" });
    modal.addEventListener("click", (event) => event.stopPropagation());
    const close = () => overlay.remove();
    overlay.onclick = close;
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });
    const header = modal.createDiv({ cls: "kw-modal-header" });
    header.createSpan({ text: "⚡ 快速定位关键词并编辑" });
    const closeBtn = header.createEl("button", { text: "×", cls: "kw-edit-modal-close" });
    closeBtn.onclick = close;
    const body = modal.createDiv({ cls: "kw-edit-modal-body" });
    body.createDiv({ cls: "kw-edit-modal-tip", text: "输入关键词后从下拉建议选择，回车或点击“编辑关键词”。当前只更新插件内存视图，不写 keyword_index.json。" });

    const quickRow = body.createDiv({ cls: "kw-mgr-quick-row" });
    const listId = `kw-mgr-quick-list-${Date.now().toString(36)}`;
    const input = quickRow.createEl("input", { cls: "kw-mgr-quick-input", attr: { type: "text", list: listId, placeholder: "例如：战略复盘 ｜ kw-xxxxxx" } });
    const dataList = quickRow.createEl("datalist", { attr: { id: listId } });
    keywords.sort(compareKeywordByPinyin).forEach((keyword) => {
      dataList.createEl("option", { attr: { value: `${keyword.displayText} ｜ ${keyword.id}`, label: `${SOURCE_COLORS[keyword.type]?.icon || "•"} ${keyword.baseKeyword}（${(keyword.notes || []).length}）` } });
    });

    const resolveKeywordId = () => {
      const raw = text(input.value);
      if (!raw) return "";
      const idMatch = raw.match(/(?:｜|\|)\s*(kw-[a-z0-9-]+)\s*$/i);
      if (idMatch && this.plugin.repository.index.keywords[idMatch[1]]) return idMatch[1];
      if (this.plugin.repository.index.keywords[raw]) return raw;
      const lower = raw.toLowerCase();
      const exact = keywords.filter((keyword) => text(keyword.displayText).toLowerCase() === lower || text(keyword.baseKeyword).toLowerCase() === lower);
      return exact.length === 1 ? exact[0].id : "";
    };

    const openEdit = () => {
      const keywordId = resolveKeywordId();
      if (!keywordId) return new Notice("⚠️ 未定位到唯一关键词，请从下拉列表选择完整项");
      this.renderKeywordEditForm(body, keywordId, close);
    };
    const editBtn = quickRow.createEl("button", { cls: "kw-mgr-quick-btn primary", text: "编辑关键词" });
    editBtn.onclick = openEdit;
    const clearBtn = quickRow.createEl("button", { cls: "kw-mgr-quick-btn", text: "清空" });
    clearBtn.onclick = () => {
      input.value = "";
      input.focus();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        openEdit();
      }
    });
    setTimeout(() => input.focus(), 0);
  }

  renderKeywordEditForm(container, keywordId, closeModal) {
    const existing = container.querySelector(".kw-quick-edit-form");
    if (existing) existing.remove();
    const keyword = this.plugin.repository.index.keywords[keywordId];
    if (!keyword) return;
    const form = container.createDiv({ cls: "kw-quick-edit-form" });
    form.createEl("h4", { text: `编辑：${keyword.displayText}` });
    const nameRow = form.createDiv({ cls: "kw-form-row" });
    nameRow.createSpan({ cls: "kw-form-label", text: "名称" });
    const nameInput = nameRow.createEl("input", { type: "text", cls: "kw-form-input", value: keyword.baseKeyword });
    const parentRow = form.createDiv({ cls: "kw-form-row" });
    parentRow.createSpan({ cls: "kw-form-label", text: "父级" });
    const parentListId = `kw-parent-list-${Date.now().toString(36)}`;
    const parentInput = parentRow.createEl("input", { type: "text", cls: "kw-form-input", attr: { list: parentListId, placeholder: "-- 顶层关键词 -- ｜ __top__" } });
    const parentList = parentRow.createEl("datalist", { attr: { id: parentListId } });
    parentList.createEl("option", { attr: { value: "-- 顶层关键词 -- ｜ __top__" } });
    const descendantIds = new Set(this.plugin.getDescendantIds(keywordId, this.plugin.repository.index.keywords));
    this.plugin.repository.listKeywords().filter((item) => item.id !== keywordId && !descendantIds.has(item.id)).sort(compareKeywordByPinyin).forEach((item) => {
      parentList.createEl("option", { attr: { value: `${item.displayText} ｜ ${item.id}` } });
      if (item.id === keyword.parentId) parentInput.value = `${item.displayText} ｜ ${item.id}`;
    });
    if (!keyword.parentId) parentInput.value = "-- 顶层关键词 -- ｜ __top__";
    const actions = form.createDiv({ cls: "kw-edit-modal-actions" });
    const saveBtn = actions.createEl("button", { text: "确认并写入索引", cls: "mod-cta" });
    saveBtn.onclick = async () => {
      const newName = text(nameInput.value);
      if (!newName) return new Notice("⚠️ 名称不能为空");
      const parentRaw = text(parentInput.value);
      const parentMatch = parentRaw.match(/(?:｜|\|)\s*(kw-[a-z0-9-]+|__top__)\s*$/i);
      const parentId = parentMatch ? parentMatch[1] : "";
      const confirmed = await this.confirmKeywordIndexWrite({ keywordId, newName, parentId: parentId && parentId !== "__top__" ? parentId : "" });
      if (!confirmed) return;
      saveBtn.disabled = true;
      saveBtn.textContent = "写入中...";
      try {
        const result = await this.plugin.saveKeywordEditToIndex({ oldId: keywordId, newLabel: newName, selectedParentId: parentId && parentId !== "__top__" ? parentId : "" });
        await this.refresh({ reload: true });
        new Notice(`✅ 已写入索引：${result.newId}`);
        if (result.manifestWarning) new Notice(`⚠️ ${result.manifestWarning}`);
        closeModal();
      } catch (error) {
        new Notice(`❌ 保存失败：${error.message}`);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "确认并写入索引";
      }
    };

    const drawerRenameSection = form.createDiv({ cls: "kw-drawer-rename-section" });
    const drawerState = {
      selectedPathParts: [],
      renameValue: "",
    };
    let lastDrawerRenamePreview = null;
    const yamlNotes = () => (keyword.notes || []).filter((note) => text(note.sourceType, keyword.type) === "yaml");
    const renderDrawerRenameSection = () => {
      drawerRenameSection.innerHTML = "";
      drawerRenameSection.createEl("h4", { text: "抽屉批量改名（仅 YAML 来源）" });
      const notes = yamlNotes();
      if (notes.length === 0) {
        drawerRenameSection.createDiv({ cls: "kw-edit-modal-tip", text: "当前关键词没有可批量改名的 YAML 来源抽屉。" });
        return;
      }

      const tree = buildSuffixTree(notes);
      const topNodes = Array.from(tree.children.values()).sort(compareDrawerNode);
      if (drawerState.selectedPathParts.length === 0 && topNodes.length > 0) {
        drawerState.selectedPathParts = [topNodes[0].label];
        drawerState.renameValue = topNodes[0].label;
      }
      const selectedNode = findSuffixTreeNodeByPath(tree, drawerState.selectedPathParts) || topNodes[0] || null;
      if (!selectedNode) {
        drawerRenameSection.createDiv({ cls: "kw-edit-modal-tip", text: "没有找到可编辑的抽屉节点。" });
        return;
      }
      if (!drawerState.renameValue) drawerState.renameValue = selectedNode.label;

      const summary = drawerRenameSection.createDiv({ cls: "kw-drawer-rename-summary" });
      summary.createDiv({ text: `YAML 来源笔记：${notes.length}` });
      summary.createDiv({ text: `根笔记：${tree.notes.length}` });
      summary.createDiv({ text: `当前路径：${drawerState.selectedPathParts.join(" + ")}` });

      const layout = drawerRenameSection.createDiv({ cls: "kw-drawer-rename-layout" });
      const treePane = layout.createDiv({ cls: "kw-drawer-rename-tree" });
      const controlPane = layout.createDiv({ cls: "kw-drawer-rename-controls" });

      const renderNode = (parent, node, pathParts, level) => {
        const row = parent.createDiv({ cls: `kw-drawer-rename-node${samePathParts(pathParts, drawerState.selectedPathParts) ? " is-selected" : ""}` });
        row.style.paddingLeft = `${level * 16}px`;
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.cursor = "pointer";
        row.createSpan({ cls: "kw-drawer-rename-node-label", text: node.label });
        row.createSpan({ cls: "kw-drawer-rename-node-count", text: `${node.notes.length}/${countTreeNotes(node)}` });
        row.title = `点击选择：${pathParts.join(" + ")}`;
        row.onclick = () => {
          drawerState.selectedPathParts = [...pathParts];
          drawerState.renameValue = node.label;
          renderDrawerRenameSection();
        };
        const children = Array.from(node.children.values()).sort(compareDrawerNode);
        if (children.length > 0) {
          const childrenWrap = parent.createDiv({ cls: "kw-drawer-rename-children" });
          children.forEach((child) => renderNode(childrenWrap, child, [...pathParts, child.label], level + 1));
        }
      };

      topNodes.forEach((node) => renderNode(treePane, node, [node.label], 0));
      if ((tree.notes || []).length > 0) {
        const rootNotes = drawerRenameSection.createDiv({ cls: "kw-drawer-rename-root-notes", text: `根笔记：${tree.notes.length} 个（不参与抽屉重命名）` });
        rootNotes.style.marginTop = "8px";
      }

      const selectedInfo = controlPane.createDiv({ cls: "kw-drawer-rename-selected" });
      selectedInfo.createDiv({ text: `选中抽屉：${drawerState.selectedPathParts.join(" + ")}` });
      selectedInfo.createDiv({ text: `原名称：${selectedNode.label}` });
      const renameRow = controlPane.createDiv({ cls: "kw-form-row" });
      renameRow.createSpan({ cls: "kw-form-label", text: "新名称" });
      const renameInput = renameRow.createEl("input", { type: "text", cls: "kw-form-input", value: drawerState.renameValue });
      const preview = controlPane.createDiv({ cls: "kw-drawer-rename-preview" });
      const previewList = preview.createEl("div");
      const previewNotice = preview.createDiv({ cls: "kw-edit-modal-tip" });
      const renameBtnRow = controlPane.createDiv({ cls: "kw-edit-modal-actions" });
      const renameBtn = renameBtnRow.createEl("button", { text: "批量改名并写回 frontmatter", cls: "mod-cta" });
      const refreshPreview = () => {
        previewList.innerHTML = "";
        const plan = buildDrawerRenamePreview(keyword, drawerState.selectedPathParts, renameInput.value);
        lastDrawerRenamePreview = plan.ok ? plan : null;
        if (!plan.ok) {
          previewNotice.textContent = plan.error;
          renameBtn.disabled = true;
          return;
        }
        drawerState.renameValue = text(renameInput.value);
        if (plan.newPathText === plan.oldPathText) {
          previewNotice.textContent = "新名称与原名称相同，未发生变化。";
          renameBtn.disabled = true;
          return;
        }
        previewNotice.textContent = `将把 ${plan.affectedCount} 个 YAML 抽屉路径 / ${plan.affectedFileCount} 个文件从 ${plan.oldPathText} 改为 ${plan.newPathText}`;
        plan.affected.slice(0, 10).forEach((item) => {
          previewList.createDiv({ text: `${item.note.path}：${item.oldFull} → ${item.newFull}` });
        });
        if (plan.affected.length > 10) {
          previewList.createDiv({ text: `……还有 ${plan.affected.length - 10} 个路径条目` });
        }
        renameBtn.disabled = false;
      };
      renameInput.oninput = refreshPreview;
      refreshPreview();
      renameBtn.onclick = async () => {
        const confirmed = await this.confirmDrawerRenameWrite({
          keywordId,
          oldPathParts: drawerState.selectedPathParts,
          newLabel: renameInput.value,
          currentLabel: selectedNode.label,
          affectedCount: lastDrawerRenamePreview?.affectedCount || 0,
          affectedFileCount: lastDrawerRenamePreview?.affectedFileCount || 0,
        });
        if (!confirmed) return;
        renameBtn.disabled = true;
        renameBtn.textContent = "写入中...";
        try {
          const result = await this.plugin.renameKeywordDrawerSegment({
            keywordId,
            oldPathParts: drawerState.selectedPathParts,
            newLabel: renameInput.value,
          });
          await this.refresh({ reload: true });
          new Notice(`✅ 已批量改名：${result.oldPathText} → ${result.newPathText}`);
          if (result.manifestWarning) new Notice(`⚠️ ${result.manifestWarning}`);
          closeModal();
        } catch (error) {
          new Notice(`❌ 抽屉改名失败：${error.message}`);
        } finally {
          renameBtn.disabled = false;
          renameBtn.textContent = "批量改名并写回 frontmatter";
        }
      };
    };
    renderDrawerRenameSection();
  }

  confirmKeywordIndexWrite({ keywordId, newName, parentId }) {
    return new Promise((resolve) => {
      const overlay = document.body.createDiv({ cls: "kw-modal-overlay kw-index-write-confirm-overlay", attr: { tabindex: "-1" } });
      const modal = overlay.createDiv({ cls: "kw-modal kw-edit-modal kw-index-write-confirm-modal" });
      modal.addEventListener("click", (event) => event.stopPropagation());
      const close = (value) => {
        overlay.remove();
        resolve(value);
      };
      overlay.onclick = () => close(false);
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close(false);
        }
      });
      const header = modal.createDiv({ cls: "kw-modal-header" });
      header.createSpan({ text: "确认写入 keyword_index.json" });
      const closeBtn = header.createEl("button", { text: "×", cls: "kw-edit-modal-close" });
      closeBtn.onclick = () => close(false);
      const body = modal.createDiv({ cls: "kw-edit-modal-body" });
      body.createDiv({ cls: "kw-edit-modal-tip", text: "该操作会备份并写入业务索引 keyword_index.json。若关键词已绑定 notes，改名会先按原版逻辑同步笔记。" });
      const info = body.createDiv({ cls: "kw-mgr-bus-preview" });
      const keyword = this.plugin.repository.index.keywords[keywordId];
      const oldName = text(keyword?.baseKeyword, keyword?.displayText);
      const isRename = oldName && oldName !== newName;
      info.createDiv({ text: `关键词 ID：${keywordId}` });
      info.createDiv({ text: `新名称：${newName}` });
      info.createDiv({ text: `新父级：${parentId || "顶层"}` });
      if (isRename && (keyword?.notes || []).length > 0) {
        info.createDiv({ text: `将同步笔记：${(keyword.notes || []).length} 个（写前会逐文件备份）` });
      }
      const actions = body.createDiv({ cls: "kw-edit-modal-actions" });
      const cancelBtn = actions.createEl("button", { text: "取消" });
      cancelBtn.onclick = () => close(false);
      const okBtn = actions.createEl("button", { text: "确认写入", cls: "mod-cta" });
      okBtn.onclick = () => close(true);
      setTimeout(() => okBtn.focus(), 0);
    });
  }

  confirmDrawerRenameWrite({ keywordId, oldPathParts, newLabel, currentLabel, affectedCount = 0, affectedFileCount = 0 }) {
    return new Promise((resolve) => {
      const overlay = document.body.createDiv({ cls: "kw-modal-overlay kw-index-write-confirm-overlay", attr: { tabindex: "-1" } });
      const modal = overlay.createDiv({ cls: "kw-modal kw-edit-modal kw-index-write-confirm-modal" });
      modal.addEventListener("click", (event) => event.stopPropagation());
      const close = (value) => {
        overlay.remove();
        resolve(value);
      };
      overlay.onclick = () => close(false);
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close(false);
        }
      });
      const header = modal.createDiv({ cls: "kw-modal-header" });
      header.createSpan({ text: "确认批量改名抽屉" });
      const closeBtn = header.createEl("button", { text: "×", cls: "kw-edit-modal-close" });
      closeBtn.onclick = () => close(false);
      const body = modal.createDiv({ cls: "kw-edit-modal-body" });
      body.createDiv({ cls: "kw-edit-modal-tip", text: "这会写回所有受影响 YAML note 的 frontmatter，并同步 keyword_index.json。请先确认预览。" });
      const info = body.createDiv({ cls: "kw-mgr-bus-preview" });
      info.createDiv({ text: `关键词 ID：${keywordId}` });
      info.createDiv({ text: `原路径：${Array.isArray(oldPathParts) ? oldPathParts.map((part) => text(part)).filter(Boolean).join(" + ") : ""}` });
      info.createDiv({ text: `当前名称：${currentLabel || ""}` });
      info.createDiv({ text: `新名称：${newLabel || ""}` });
      info.createDiv({ text: `预计影响：${affectedCount} 个抽屉路径 / ${affectedFileCount} 个文件` });
      const actions = body.createDiv({ cls: "kw-edit-modal-actions" });
      const cancelBtn = actions.createEl("button", { text: "取消" });
      cancelBtn.onclick = () => close(false);
      const okBtn = actions.createEl("button", { text: "确认写入", cls: "mod-cta" });
      okBtn.onclick = () => close(true);
      setTimeout(() => okBtn.focus(), 0);
    });
  }

  renderDisplayView(wrap) {
    const allKeywords = this.prepareDisplayProjection();
    const matchedIds = new Set();
    allKeywords.forEach((keyword) => {
      if (!this.query) {
        matchedIds.add(keyword.id);
        return;
      }
      const haystack = [keyword.displayText, keyword.baseKeyword, keyword.type, ...(keyword.notes || []).map((note) => note.name)].join(" ").toLowerCase();
      if (haystack.includes(this.query)) {
        matchedIds.add(keyword.id);
        let parentId = keyword.parentId;
        while (parentId && this.displayKeywordsById[parentId]) {
          matchedIds.add(parentId);
          parentId = this.displayKeywordsById[parentId].parentId;
        }
      }
    });
    const keywords = allKeywords.filter((keyword) => matchedIds.has(keyword.id));
    this.visibleKeywordIds = new Set(keywords.map((keyword) => keyword.id));

    if (keywords.length === 0) {
      const index = wrap.createDiv({ cls: "kw-nest-container" });
      const emptyText = this.isSymbolDialogueMode()
        ? Number(this.dialogueProjectionStats?.qualifyingRegistrationCount || 0) === 0
          ? "暂无 frontmatter 为“符号对话: true”的关联笔记。"
          : "当前“符号对话”视图中没有匹配搜索的关键词。"
        : "暂无关键词，点击“扫描预览”查看只读扫描统计。";
      index.createDiv({ cls: "kw-empty", text: emptyText });
      return;
    }

    const groupedKeywords = filterSameLetterChildAliasesForGlobalGroups(keywords, this.visibleKeywordIds, this.displayKeywordsById || {});
    const grouped = groupKeywordsByLetter(groupedKeywords);
    this.renderFloatingLetterToc(wrap, grouped);
    const nav = wrap.createDiv({ cls: "kw-alphabet-nav" });
    grouped.forEach(([letter]) => {
      const link = nav.createEl("a", { cls: "kw-letter-link", text: letter });
      link.onclick = (event) => {
        event.preventDefault();
        const target = wrap.querySelector(`#kw-group-${safeDomIdPart(letter)}`);
        this.scrollGroupHeaderIntoView(target, letter);
      };
    });

    const index = wrap.createDiv({ cls: "kw-nest-container" });
    grouped.forEach(([letter, items]) => {
      const groupHeader = index.createEl("h3", { cls: "kw-group-header", text: letter });
      groupHeader.id = `kw-group-${safeDomIdPart(letter)}`;
      const groupContent = index.createDiv({ cls: "kw-group-content" });
      if (letter === "M") {
        console.info("[KeywordIndex][sort-debug.group-M]", items.map((keyword, orderIndex) => ({
          orderIndex,
          id: keyword.id,
          displayText: text(keyword.displayText, keyword.baseKeyword),
          sortKey: getPinyinSortKey(getKeywordSortText(keyword)),
          pinyinEngineReady: Boolean(pinyinPro?.pinyin),
          pinyinCharMapReady: Object.keys(PINYIN_STATIC_CHAR_MAP).length,
          parentId: text(keyword.parentId),
          order: Number(keyword.order) || 0,
        })));
      }
      if (items.length >= LETTER_GROUP_SECONDARY_NAV_THRESHOLD) {
        console.info("[KeywordIndex][secondary-nav.group]", { letter, count: items.length, threshold: LETTER_GROUP_SECONDARY_NAV_THRESHOLD });
        this.renderLargeLetterGroup(groupContent, letter, items);
      } else items.forEach((keyword) => this.renderLetterGroupKeyword(groupContent, keyword));
    });

    if (this.isSymbolDialogueMode()) {
      const renderedKeywordIds = new Set(Array.from(
        index.querySelectorAll("[data-keyword-id][data-keyword-primary-anchor='true']"),
        (element) => text(element.dataset.keywordId),
      ).filter(Boolean));
      const renderedNoteCount = Array.from(renderedKeywordIds).reduce(
        (sum, keywordId) => sum + (this.displayKeywordsById[keywordId]?.notes || []).length,
        0,
      );
      index.createDiv({ cls: "kw-stats", text: `符号对话：共 ${grouped.length} 个分类，${renderedKeywordIds.size} 个关键词节点，${renderedNoteCount} 条关联笔记记录` });
    } else {
      const stats = this.plugin.repository.getStats();
      index.createDiv({ cls: "kw-stats", text: `共 ${grouped.length} 个分类，${stats.keywordCount} 个关键词，${stats.noteCount} 篇关联笔记` });
    }
  }

  renderFloatingLetterToc(wrap, grouped) {
    if (!Array.isArray(grouped) || grouped.length <= 1) return;
    const toc = wrap.createDiv({
      cls: "kw-floating-letter-toc",
      attr: { "aria-label": "字母快速导航" },
    });
    toc.createDiv({
      cls: "kw-floating-letter-toc-current",
      text: grouped[0]?.[0] || "",
      attr: { title: "当前位置" },
    });
    grouped.forEach(([letter]) => {
      const link = toc.createEl("button", {
        cls: "kw-floating-letter-toc-link",
        text: letter,
        attr: {
          type: "button",
          title: `跳转到 ${letter}`,
          "data-letter": letter,
          "aria-current": "false",
        },
      });
      link.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const target = wrap.querySelector(`#kw-group-${safeDomIdPart(letter)}`);
        this.scrollGroupHeaderIntoView(target, letter);
      };
    });
    window.requestAnimationFrame(() => this.trackFloatingLetterToc(wrap, toc, grouped));
  }

  renderLetterGroupKeyword(container, keyword) {
    const parentExists = keyword.parentId && this.plugin.repository.index.keywords[keyword.parentId];
    if (parentExists) this.renderKeywordIndexEntry(container, keyword);
    else this.renderCapsule(container, keyword);
  }

  renderLargeLetterGroup(container, letter, items) {
    const grouped = groupKeywordsBySecondaryKey(items, letter);
    if (grouped.length <= 1) {
      items.forEach((keyword) => this.renderLetterGroupKeyword(container, keyword));
      return;
    }
    const targets = new Map();
    const nav = container.createDiv({ cls: "kw-alphabet-nav kw-child-alphabet-nav kw-letter-secondary-nav" });
    grouped.forEach((group) => {
      const link = nav.createEl("a", { cls: "kw-letter-link kw-child-letter-link kw-letter-secondary-link", text: group.label });
      link.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.scrollGroupHeaderIntoView(targets.get(group.key), `${letter}/${group.label}`);
      };
    });
    grouped.forEach((group) => {
      const section = container.createDiv({ cls: "kw-letter-secondary-section" });
      const groupHeader = section.createDiv({ cls: "kw-child-group-header kw-letter-secondary-group-header", text: group.label });
      targets.set(group.key, groupHeader);
      const groupContent = section.createDiv({ cls: "kw-child-group-content kw-letter-secondary-group-content" });
      group.items.forEach((keyword) => this.renderLetterGroupKeyword(groupContent, keyword));
    });
  }

  renderKeywordIndexEntry(container, keyword) {
    const types = getKeywordSourceTypes(keyword);
    const sourceClass = types.length > 1 ? "mixed" : text(types[0], "yaml");
    const source = SOURCE_COLORS[sourceClass] || SOURCE_COLORS.yaml;
    const parent = this.plugin.repository.index.keywords?.[text(keyword.parentId)];
    const shell = container.createDiv({ cls: "kw-capsule-shell kw-index-entry-shell" });
    const entry = shell.createDiv({ cls: `kw-capsule kw-keyword-index-entry kw-type-${sourceClass}` });
    const header = entry.createDiv({ cls: "kw-capsule-header kw-keyword-index-entry-header" });
    if (sourceClass === "mixed") {
      const icons = ["yaml", "plus", "dot"].filter((type) => types.includes(type)).map((type) => SOURCE_COLORS[type].icon);
      header.createSpan({ cls: "kw-capsule-icon kw-capsule-icon-mixed", text: icons.join("") || source.icon });
    } else {
      header.createSpan({ cls: "kw-capsule-icon", text: source.icon });
    }
    header.createSpan({ cls: "kw-capsule-label", text: text(keyword.displayText, keyword.baseKeyword) });
    if (parent) header.createSpan({ cls: "kw-index-entry-path", text: `↳ ${text(parent.displayText, parent.baseKeyword)}` });
    if ((keyword.notes || []).length > 0) header.createSpan({ cls: "kw-capsule-badge", text: String(keyword.notes.length) });
    header.title = parent ? `位于：${text(parent.displayText, parent.baseKeyword)} / ${text(keyword.displayText, keyword.baseKeyword)}` : text(keyword.displayText, keyword.baseKeyword);
    header.onclick = (event) => {
      event.stopPropagation();
      this.revealKeywordPrimaryAnchor(keyword.id);
    };
  }

  buildKeywordRefLookup() {
    if (this.keywordRefLookup) return this.keywordRefLookup;
    const lookup = new Map();
    Object.values(this.plugin.repository.index.keywords || {}).forEach((keyword) => {
      [keyword.displayText, keyword.baseKeyword, keyword.id]
        .map((value) => normalizeKeywordRefLookupKey(value))
        .filter(Boolean)
        .forEach((key) => {
          if (!lookup.has(key)) lookup.set(key, keyword);
        });
    });
    this.keywordRefLookup = lookup;
    return lookup;
  }

  resolveBoldKeywordRef(rawLabel) {
    const raw = text(rawLabel);
    if (!raw) return null;
    const lookup = this.buildKeywordRefLookup();
    const rawHit = lookup.get(normalizeKeywordRefLookupKey(raw));
    if (rawHit) return { raw, displayLabel: text(rawHit.displayText, rawHit.baseKeyword), keyword: rawHit, sortKey: raw };
    const stripped = /^[A-Z](?=.)/.test(raw) ? text(raw.slice(1)) : "";
    if (stripped) {
      const strippedHit = lookup.get(normalizeKeywordRefLookupKey(stripped));
      if (strippedHit) return { raw, displayLabel: text(strippedHit.displayText, strippedHit.baseKeyword), keyword: strippedHit, sortKey: raw };
    }
    return null;
  }

  getBoldKeywordOutboundRefs(keyword) {
    const seen = new Set();
    const refs = [];
    const capsuleNodeKey = this.plugin.buildKeywordNodeKey(keyword?.id);
    const commentEntry = capsuleNodeKey ? this.plugin.getKeywordComment(capsuleNodeKey) : {};
    const sources = [commentEntry.references].map((value) => text(value)).filter(Boolean);
    sources.forEach((sourceText) => {
      extractBoldKeywordRefTexts(sourceText).forEach((rawLabel) => {
        const ref = this.resolveBoldKeywordRef(rawLabel);
        if (!ref?.keyword?.id || ref.keyword.id === keyword.id) return;
        if (seen.has(ref.keyword.id)) return;
        seen.add(ref.keyword.id);
        refs.push(ref);
      });
    });
    return refs.sort((a, b) => text(a.sortKey).localeCompare(text(b.sortKey), "zh-CN", { numeric: true, sensitivity: "base" })
      || compareKeywordByPinyin(a.keyword, b.keyword));
  }

  buildBoldKeywordReferenceIndex() {
    if (this.boldKeywordReferenceIndex) return this.boldKeywordReferenceIndex;
    const inbound = new Map();
    const outbound = new Map();
    Object.values(this.plugin.repository.index.keywords || {}).forEach((keyword) => {
      const refs = this.getBoldKeywordOutboundRefs(keyword);
      outbound.set(keyword.id, refs);
      refs.forEach((ref) => {
        const targetId = ref.keyword?.id;
        if (!targetId) return;
        if (!inbound.has(targetId)) inbound.set(targetId, []);
        inbound.get(targetId).push({
          raw: ref.raw,
          displayLabel: text(keyword.displayText, keyword.baseKeyword),
          keyword,
          sortKey: ref.sortKey,
        });
      });
    });
    inbound.forEach((items) => {
      items.sort((a, b) => compareKeywordByPinyin(a.keyword, b.keyword)
        || text(a.sortKey).localeCompare(text(b.sortKey), "zh-CN", { numeric: true, sensitivity: "base" }));
    });
    this.boldKeywordReferenceIndex = { inbound, outbound };
    return this.boldKeywordReferenceIndex;
  }

  getBoldKeywordReferenceGroups(keyword) {
    if (!keyword?.id) return { outbound: [], inbound: [] };
    const index = this.buildBoldKeywordReferenceIndex();
    return {
      outbound: index.outbound.get(keyword.id) || [],
      inbound: index.inbound.get(keyword.id) || [],
    };
  }

  scheduleBoldRefPopoverClose() {
    window.clearTimeout(this.boldRefPopoverCloseTimer);
    this.boldRefPopoverCloseTimer = window.setTimeout(() => this.closeBoldRefPopover(), 180);
  }

  cancelBoldRefPopoverClose() {
    window.clearTimeout(this.boldRefPopoverCloseTimer);
    this.boldRefPopoverCloseTimer = null;
  }

  closeBoldRefPopover() {
    this.cancelBoldRefPopoverClose();
    if (this.boldRefPopover) {
      this.boldRefPopover.remove();
      this.boldRefPopover = null;
    }
  }

  showBoldRefPopover(anchor, groups, ownerKeyword) {
    const outbound = Array.isArray(groups?.outbound) ? groups.outbound : [];
    const inbound = Array.isArray(groups?.inbound) ? groups.inbound : [];
    if (!anchor || (outbound.length === 0 && inbound.length === 0)) return;
    this.closeBoldRefPopover();
    const popover = document.body.createDiv({ cls: "kw-bold-ref-popover" });
    this.boldRefPopover = popover;
    popover.addEventListener("mouseenter", () => this.cancelBoldRefPopoverClose());
    popover.addEventListener("mouseleave", () => this.scheduleBoldRefPopoverClose());
    popover.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    popover.addEventListener("click", (event) => event.stopPropagation());
    const title = popover.createDiv({ cls: "kw-bold-ref-popover-title", text: "关联关键词" });
    title.title = "从参考关键词里的 **...** 标记识别";
    const renderSection = (label, items, direction) => {
      if (!items.length) return;
      popover.createDiv({ cls: `kw-bold-ref-section-title is-${direction}`, text: `${label} ${items.length}` });
      items.forEach((ref) => {
        const item = popover.createEl("button", { cls: `kw-bold-ref-popover-item is-${direction}`, text: ref.displayLabel });
        item.title = ref.raw === ref.displayLabel ? ref.displayLabel : `${ref.raw} -> ${ref.displayLabel}`;
        item.onclick = async (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.closeBoldRefPopover();
          await this.plugin.revealKeywordById(ref.keyword.id, { reason: `bold-keyword-ref-${direction}`, sourceKeywordId: ownerKeyword?.id || "" });
        };
      });
    };
    renderSection("标注引用", outbound, "outbound");
    renderSection("反向引用", inbound, "inbound");
    const rect = anchor.getBoundingClientRect();
    const gap = 8;
    const maxLeft = Math.max(8, window.innerWidth - popover.offsetWidth - 8);
    const left = Math.min(Math.max(8, rect.left), maxLeft);
    let top = rect.bottom + gap;
    if (top + popover.offsetHeight > window.innerHeight - 8) top = Math.max(8, rect.top - popover.offsetHeight - gap);
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  renderBoldKeywordRefTrigger(container, keyword) {
    const groups = this.getBoldKeywordReferenceGroups(keyword);
    const outboundCount = groups.outbound.length;
    const inboundCount = groups.inbound.length;
    if (outboundCount === 0 && inboundCount === 0) return;
    const trigger = container.createEl("button", {
      cls: "kw-bold-ref-trigger",
      text: "↔",
      attr: { "aria-label": "参考关键词标记关联关键词" },
    });
    trigger.title = `参考关键词关联：标注 ${outboundCount} / 反向 ${inboundCount}`;
    trigger.addEventListener("mouseenter", () => {
      this.cancelBoldRefPopoverClose();
      this.showBoldRefPopover(trigger, groups, keyword);
    });
    trigger.addEventListener("mouseleave", () => this.scheduleBoldRefPopoverClose());
    trigger.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.boldRefPopover) this.closeBoldRefPopover();
      else this.showBoldRefPopover(trigger, groups, keyword);
    };
  }

  revealKeywordPrimaryAnchor(keywordId, behavior = 'smooth') {
    const target = this.findRevealTarget('', keywordId);
    if (!target) { console.warn('[KeywordIndex][keyword.primary-reveal-miss]', { keywordId }); return false; }
    target.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
    target.addClass?.('is-eva-reveal-target');
    window.setTimeout(() => target.removeClass?.('is-eva-reveal-target'), 1400);
    console.info('[KeywordIndex][keyword.primary-reveal]', { keywordId });
    return true;
  }

  renderChildLetterNav(container, children) {
    if (!Array.isArray(children) || children.length <= 10) return null;
    const grouped = groupKeywordsByLetter(children);
    if (grouped.length <= 1) return grouped;
    const targets = new Map();
    const nav = container.createDiv({ cls: "kw-alphabet-nav kw-child-alphabet-nav" });
    grouped.forEach(([letter]) => {
      const link = nav.createEl("a", { cls: "kw-letter-link kw-child-letter-link", text: letter });
      link.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.scrollGroupHeaderIntoView(targets.get(letter), letter);
      };
    });
    return { grouped, targets };
  }

  renderCapsule(container, keyword) {
    const types = getKeywordSourceTypes(keyword);
    const sourceClass = types.length > 1 ? "mixed" : text(types[0], "yaml");
    const source = SOURCE_COLORS[sourceClass] || SOURCE_COLORS.yaml;
    const children = this.getVisibleChildren(keyword.id);
    const hasChildren = children.length > 0;
    const isCollapsed = this.collapsedIds.has(keyword.id);
    const isNotesOpen = this.notesOpenIds.has(keyword.id);
    const noteCount = (keyword.notes || []).length;
    const hasTreeMarker = keywordHasTreeMarker(keyword);
    const shell = container.createDiv({ cls: `kw-capsule-shell${isNotesOpen ? " is-notes-open" : ""}` });
    const capsule = shell.createDiv({
      cls: `kw-capsule kw-type-${sourceClass}${hasChildren ? " has-children" : ""}${isCollapsed ? " is-collapsed" : ""}${hasTreeMarker ? " is-tree-positioned-capsule" : ""}${getNoteHeatClass(noteCount)}`,
    });

    const header = capsule.createDiv({ cls: "kw-capsule-header" });
    const capsuleNodeKey = this.plugin.buildKeywordNodeKey(keyword.id);
    header.dataset.keywordId = keyword.id;
    header.dataset.keywordPrimaryAnchor = "true";
    if (capsuleNodeKey) header.dataset.evaNodeKey = capsuleNodeKey;
    if (hasChildren) {
      const toggle = header.createSpan({ cls: "kw-capsule-toggle", text: isCollapsed ? "▶" : "▼" });
      toggle.onclick = (event) => {
        event.stopPropagation();
        if (this.collapsedIds.has(keyword.id)) this.collapsedIds.delete(keyword.id);
        else this.collapsedIds.add(keyword.id);
        this.persistUiStateSoon();
        this.render();
      };
    }

    if (sourceClass === "mixed") {
      const icons = ["yaml", "plus", "dot"].filter((type) => types.includes(type)).map((type) => SOURCE_COLORS[type].icon);
      header.createSpan({ cls: "kw-capsule-icon kw-capsule-icon-mixed", text: icons.join("") || source.icon });
    } else {
      header.createSpan({ cls: "kw-capsule-icon", text: source.icon });
    }
    header.createSpan({ cls: "kw-capsule-label", text: text(keyword.displayText, keyword.baseKeyword) });
    if (hasTreeMarker) {
      const badge = header.createSpan({ cls: "kw-drawer-tree-badge", text: "T" });
      badge.title = "这个关键词胶囊自身或下属抽屉包含带 (tree) 标记的 note，表示已经在树上找到位置。";
    }
    if (noteCount > 0) header.createSpan({ cls: `kw-capsule-badge${getNoteHeatClass(noteCount)}`, text: String(noteCount) });
    this.renderBoldKeywordRefTrigger(header, keyword);
    this.renderEvaRelationButton(header, capsuleNodeKey, "关联关键词胶囊");

    header.onclick = async (event) => {
      event.stopPropagation();
      logKeywordColorDebug(shell, `keyword:${keyword.id}`);
      if ((keyword.notes || []).length > 0) {
        if (this.notesOpenIds.has(keyword.id)) this.notesOpenIds.delete(keyword.id);
        else this.notesOpenIds.add(keyword.id);
        console.debug("[KeywordIndex][capsule.toggle-notes]", {
          id: keyword.id,
          notes: (keyword.notes || []).length,
          hasChildren,
          sourceTypes: getKeywordSourceTypes(keyword),
          open: this.notesOpenIds.has(keyword.id),
        });
        this.persistUiStateSoon();
        this.render();
      } else if (hasChildren) {
        if (this.collapsedIds.has(keyword.id)) this.collapsedIds.delete(keyword.id);
        else this.collapsedIds.add(keyword.id);
        this.persistUiStateSoon();
        this.render();
      }
    };

    if ((keyword.notes || []).length > 0) {
      const drawer = capsule.createDiv({ cls: "kw-notes-drawer" });
      if (!isNotesOpen) drawer.style.display = "none";
      if (isNotesOpen) this.renderNotesDrawer(drawer, keyword);
    }

    if (hasChildren && !isCollapsed) {
      const childrenContainer = capsule.createDiv({ cls: "kw-capsule-children" });
      const childNav = this.renderChildLetterNav(childrenContainer, children);
      if (childNav?.grouped && childNav?.targets) {
        childNav.grouped.forEach(([letter, childItems]) => {
          const groupHeader = childrenContainer.createDiv({ cls: "kw-child-group-header", text: letter });
          childNav.targets.set(letter, groupHeader);
          const groupContent = childrenContainer.createDiv({ cls: "kw-child-group-content" });
          const firstChild = childItems[0];
          childItems.forEach((child) => this.renderCapsule(groupContent, child));
          const firstTarget = firstChild?.id
            ? Array.from(childrenContainer.querySelectorAll("[data-keyword-id][data-keyword-primary-anchor]"))
              .find((el) => el.dataset.keywordId === firstChild.id && el.dataset.keywordPrimaryAnchor === "true")
            : null;
          if (firstTarget) childNav.targets.set(letter, firstTarget);
        });
      } else {
        children.forEach((child) => this.renderCapsule(childrenContainer, child));
      }
    }
  }

  async openNote(note) {
    const file = this.plugin.app.vault.getAbstractFileByPath(note.path);
    if (file instanceof TFile) {
      await this.plugin.app.workspace.getLeaf(false).openFile(file);
    } else {
      new Notice(`Note not found: ${note.path}`);
    }
  }

  renderNotesDrawer(drawer, keyword) {
    const typeOrder = ["yaml", "plus", "dot"];
    const typeNames = {
      yaml: "◆ YAML关键词管理",
      plus: "▲ 层级关键词 ++...++",
      dot: "● 行内关键词 ··...··",
    };
    const groupedNotes = { yaml: [], plus: [], dot: [] };
    (keyword.notes || []).forEach((note) => {
      const sourceType = text(note.sourceType, keyword.type);
      if (!groupedNotes[sourceType]) groupedNotes[sourceType] = [];
      groupedNotes[sourceType].push(note);
    });
    const projectedTreesByType = this.isSymbolDialogueMode() ? keyword.dialogueProjectedTreesByType || {} : {};
    const activeTypes = typeOrder.filter((type) => this.isSymbolDialogueMode()
      ? suffixTreeHasContent(projectedTreesByType[type])
      : (groupedNotes[type] || []).length > 0);
    const hasMultipleTypes = activeTypes.length > 1;
    typeOrder.forEach((type) => {
      const notes = groupedNotes[type] || [];
      const projectedTree = projectedTreesByType[type] || null;
      if (notes.length === 0 && !suffixTreeHasContent(projectedTree)) return;
      if (hasMultipleTypes) {
        const groupHeader = drawer.createDiv({ cls: `kw-drawer-group-header type-${type}` });
        groupHeader.createSpan({ text: SOURCE_COLORS[type].icon });
        groupHeader.createSpan({ text: typeNames[type] });
        groupHeader.createSpan({ cls: "kw-drawer-group-count", text: String(notes.length) });
      }
      this.renderMultiLevelDrawer(drawer, notes, type, keyword, projectedTree);
    });
  }

  renderMultiLevelDrawer(drawer, notes, type, keyword, projectedTree = null) {
    const tree = projectedTree || buildSuffixTree(notes);
    const children = Array.from(tree.children.values()).sort(compareDrawerNode);
    const subconcepts = tree.subconcepts;
    if ((tree.notes || []).length > 0 && (children.length > 0 || (subconcepts?.size || 0) > 0)) this.renderRootNotesDrawer(drawer, tree.notes, type, keyword, []);
    else if ((tree.notes || []).length > 0) [...tree.notes].sort(compareNoteName).forEach((note) => this.renderNoteRow(drawer, note, type));
    children.forEach((child) => this.renderDrawerTree(drawer, child, 0, type, keyword, [child.label]));
    this.renderSubconceptCapsules(drawer, subconcepts, 0, type, keyword, []);
    if (type === "yaml" && children.some((child) => parseBusSegment(child.label))) this.renderBusActionIfAvailable(drawer, keyword, []);
  }

  renderSubconceptCapsules(container, nodes, level, type, keyword, parentPathParts) {
    const items = Array.from(nodes?.values?.() || []).sort(compareDrawerNode);
    if (!items.length) return;
    const shell = container.createDiv({ cls: "kw-subconcept-section" });
    const indent = Math.max(0, level) * 20;
    shell.style.marginLeft = `${indent}px`;
    shell.style.width = `calc(100% - ${indent}px)`;
    const header = shell.createDiv({ cls: "kw-subconcept-section-title", text: "子概念" });
    header.title = "SCON. 子概念：归属在当前抽屉语境下";
    const group = shell.createDiv({ cls: "kw-subconcept-capsules" });
    const renderItem = (node, parent) => {
      const pathParts = [...parentPathParts, getSubconceptRawPathPart(node)];
      const key = buildDrawerStateKey(keyword.id, type, pathParts, "branch");
      const isOpen = Object.prototype.hasOwnProperty.call(this.drawerExpanded, key) ? this.drawerExpanded[key] === true : false;
      const noteCount = countTreeNotes(node);
      const hasTreeMarker = drawerNodeHasTreeMarker(node);
      const capsule = parent.createDiv({ cls: `kw-subconcept-capsule kw-capsule kw-type-${type}${isOpen ? " is-open" : ""}${hasTreeMarker ? " is-tree-positioned-capsule" : ""}${getNoteHeatClass(noteCount)}` });
      const nodeKey = this.plugin.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "branch");
      if (nodeKey) capsule.dataset.evaNodeKey = nodeKey;
      const head = capsule.createDiv({ cls: "kw-capsule-header kw-subconcept-capsule-header" });
      head.createSpan({ cls: "kw-capsule-toggle", text: isOpen ? "▼" : "▶" });
      head.createSpan({ cls: "kw-capsule-icon", text: "◇" });
      head.createSpan({ cls: "kw-capsule-label", text: text(node.displayLabel, node.label) });
      if (hasTreeMarker) {
        const badge = head.createSpan({ cls: "kw-drawer-tree-badge", text: "T" });
        badge.title = "该子概念包含标题带 (tree) 的笔记，表示已在树上找到位置";
      }
      head.createSpan({ cls: `kw-capsule-badge${getNoteHeatClass(noteCount)}`, text: String(noteCount) });
      this.renderEvaRelationButton(head, nodeKey, "关联子概念");
      head.onclick = (event) => {
        event.stopPropagation();
        this.drawerExpanded[key] = !isOpen;
        this.persistUiStateSoon();
        this.render();
      };
      const body = capsule.createDiv({ cls: "kw-subconcept-body kw-drawer-children" });
      if (!isOpen) body.style.display = "none";
      if (isOpen) this.renderSubconceptBody(body, node, level + 1, type, keyword, pathParts);
    };
    if (items.length > 10) {
      const grouped = new Map();
      items.forEach((node) => {
        const key = text(node.subconceptGroupLetter, getLetterGroupSecondaryLabel({ displayText: node.displayLabel || node.label, baseKeyword: node.displayLabel || node.label }, "ALL"));
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(node);
      });
      Array.from(grouped.entries())
        .sort((a, b) => text(a[0]).localeCompare(text(b[0]), "zh-CN", { numeric: true, sensitivity: "base" }))
        .forEach(([label, groupItems]) => {
          const groupShell = group.createDiv({ cls: "kw-subconcept-name-group" });
          groupShell.createDiv({ cls: "kw-subconcept-name-group-title", text: label });
          const groupBody = groupShell.createDiv({ cls: "kw-subconcept-name-group-body" });
          groupItems.forEach((node) => renderItem(node, groupBody));
        });
      return;
    }
    items.forEach((node) => renderItem(node, group));
  }

  renderSubconceptBody(container, node, level, type, keyword, pathParts) {
    const children = Array.from(node.children?.values?.() || []).sort(compareDrawerNode);
    const subconcepts = node.subconcepts;
    const hasDirectNotes = (node.notes || []).length > 0;
    if (hasDirectNotes && (children.length > 0 || (subconcepts?.size || 0) > 0)) this.renderRootNotesDrawer(container, node.notes, type, keyword, pathParts);
    else if (hasDirectNotes) [...node.notes].sort(compareNoteName).forEach((note) => this.renderNoteRow(container, note, type));
    children.forEach((child) => this.renderDrawerTree(container, child, level, type, keyword, [...pathParts, child.label]));
    this.renderSubconceptCapsules(container, subconcepts, level, type, keyword, pathParts);
    if (type === "yaml" && children.some((child) => parseBusSegment(child.label))) this.renderBusActionIfAvailable(container, keyword, pathParts, level);
  }

  renderRootNotesDrawer(container, notes, type, keyword, pathParts) {
    const rootKey = buildDrawerStateKey(keyword.id, type, pathParts, "root-notes");
    const isOpen = Object.prototype.hasOwnProperty.call(this.drawerExpanded, rootKey) ? this.drawerExpanded[rootKey] === true : false;
    const wrapper = container.createDiv({ cls: "kw-drawer-root-notes" });
    const noteCount = notes.length;
    const hasTreeMarker = notesHaveTreeMarker(notes);
    const header = wrapper.createDiv({ cls: `kw-drawer-branch-header kw-drawer-parent kw-drawer-root-parent kw-drawer-inline-row${isOpen ? " is-open" : ""}${hasTreeMarker ? " is-tree-positioned-drawer" : ""}${getNoteHeatClass(noteCount)}` });
    const nodeKey = this.plugin.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "root-notes");
    if (nodeKey) header.dataset.evaNodeKey = nodeKey;
    const indent = pathParts.length * 20;
    header.style.marginLeft = `${indent}px`;
    header.style.width = `calc(100% - ${indent}px)`;
    const toggle = header.createSpan({ cls: "kw-drawer-branch-toggle kw-drawer-toggle", text: "▼" });
    toggle.style.transform = isOpen ? "rotate(90deg)" : "";
    header.createSpan({ cls: "kw-drawer-branch-label kw-drawer-label", text: "📝 根笔记" });
    if (hasTreeMarker) {
      const badge = header.createSpan({ cls: "kw-drawer-tree-badge", text: "T" });
      badge.title = "该抽屉包含标题带 (tree) 的笔记，表示已在树上找到位置";
    }
    header.createSpan({ cls: `kw-drawer-branch-count kw-drawer-count${getNoteHeatClass(noteCount)}`, text: `(${noteCount})` });
    this.renderEvaRelationButton(header, nodeKey, "关联根笔记抽屉");
    const body = header.createDiv({ cls: "kw-drawer-branch-body kw-drawer-children kw-drawer-root-children kw-drawer-inline-notes" });
    if (!isOpen) body.style.display = "none";
    header.onclick = (event) => {
      event.stopPropagation();
      this.drawerExpanded[rootKey] = !isOpen;
      this.persistUiStateSoon();
      this.render();
    };
    if (isOpen) [...notes].sort(compareNoteName).forEach((note) => this.renderNoteRow(body, note, type));
  }

  renderDrawerTree(container, node, level, type, keyword, pathParts) {
    const key = buildDrawerStateKey(keyword.id, type, pathParts, "branch");
    const isBusNode = Boolean(parseBusSegment(node.label));
    const hasChildDrawers = (node.children?.size || 0) > 0;
    const hasSubconcepts = (node.subconcepts?.size || 0) > 0;
    const hasDirectNotes = (node.notes || []).length > 0;
    const isInvalidSubconceptNesting = Boolean(node.invalidSubconceptNesting);
    const defaultOpen = (hasChildDrawers || hasSubconcepts) && !isBusNode;
    const isOpen = Object.prototype.hasOwnProperty.call(this.drawerExpanded, key) ? this.drawerExpanded[key] === true : defaultOpen;
    const leafWithNotes = hasDirectNotes && childrenHaveNoDrawers(node);
    const noteCount = countTreeNotes(node);
    const branch = container.createDiv({ cls: `kw-drawer-branch level-${level}${isMermaidDrawerLabel(node.label) ? " is-mermaid-row" : ""}${isOpen ? " is-open" : ""}` });
    const isMermaidDrawer = isMermaidDrawerLabel(node.label);
    const hasTreeMarker = drawerNodeHasTreeMarker(node);
    const header = branch.createDiv({ cls: `kw-drawer-branch-header kw-drawer-parent${leafWithNotes ? " kw-drawer-inline-row" : ""}${leafWithNotes && isOpen ? " is-open" : ""}${!isOpen && (hasChildDrawers || hasSubconcepts) ? " is-collapsed" : ""}${isBusNode ? " is-bus-drawer" : ""}${isMermaidDrawer ? " is-mermaid-drawer" : ""}${hasTreeMarker ? " is-tree-positioned-drawer" : ""}${isInvalidSubconceptNesting ? " is-invalid-subconcept-nesting" : ""}${getNoteHeatClass(noteCount)}` });
    const nodeKey = this.plugin.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "branch");
    if (nodeKey) header.dataset.evaNodeKey = nodeKey;
    const indent = level * 20;
    header.style.marginLeft = `${indent}px`;
    header.style.width = `calc(100% - ${indent}px)`;
    const toggle = header.createSpan({ cls: "kw-drawer-branch-toggle kw-drawer-toggle", text: "▼" });
    if (!isOpen) toggle.style.transform = "";
    else toggle.style.transform = "rotate(90deg)";
    header.createSpan({ cls: "kw-drawer-branch-label kw-drawer-label", text: node.label });
    if (isMermaidDrawer) header.createSpan({ cls: "kw-drawer-mermaid-badge", text: "M" });
    if (isInvalidSubconceptNesting) {
      const badge = header.createSpan({ cls: "kw-drawer-invalid-scon-badge", text: "SCON!" });
      badge.title = "规则提示：subconcept 下面不能直接再接 subconcept；请改为 SCON.子概念 + 抽屉 + SCON.子概念";
    }
    if (hasTreeMarker) {
      const badge = header.createSpan({ cls: "kw-drawer-tree-badge", text: "T" });
      badge.title = "该抽屉包含标题带 (tree) 的笔记，表示已在树上找到位置";
    }
    header.createSpan({ cls: `kw-drawer-branch-count kw-drawer-count${getNoteHeatClass(noteCount)}`, text: `(${noteCount})` });
    this.renderEvaRelationButton(header, nodeKey, isBusNode ? "关联 BUS 抽屉" : "关联抽屉");
    const body = leafWithNotes
      ? header.createDiv({ cls: "kw-drawer-branch-body kw-drawer-children kw-drawer-inline-notes" })
      : branch.createDiv({ cls: "kw-drawer-branch-body kw-drawer-children" });
    if (!isOpen) body.style.display = "none";
    const toggleDrawer = (event) => {
      event.stopPropagation();
      this.drawerExpanded[key] = !(body.style.display !== "none");
      this.persistUiStateSoon();
      this.render();
    };
    header.onclick = toggleDrawer;
    toggle.onclick = toggleDrawer;
    if (!isOpen) return;
    const children = Array.from(node.children.values()).sort(compareDrawerNode);
    const subconcepts = node.subconcepts;
    if (hasDirectNotes && (children.length > 0 || (subconcepts?.size || 0) > 0)) this.renderRootNotesDrawer(body, node.notes, type, keyword, pathParts);
    else if (hasDirectNotes) [...node.notes].sort(compareNoteName).forEach((note) => this.renderNoteRow(body, note, type));
    children.forEach((child) => this.renderDrawerTree(body, child, level + 1, type, keyword, [...pathParts, child.label]));
    this.renderSubconceptCapsules(body, subconcepts, level + 1, type, keyword, pathParts);
    if (type === "yaml" && children.some((child) => parseBusSegment(child.label))) this.renderBusActionIfAvailable(body, keyword, pathParts, level + 1);
  }

  getRenderedBusScope(keyword, prefixParts) {
    if (!this.isSymbolDialogueMode()) return this.plugin.findBusScopeForKeywordPrefix(keyword.id, prefixParts);
    const projectedTree = keyword.dialogueProjectedTreesByType?.yaml;
    const projectedPrefix = findSuffixTreeNodeByPath(projectedTree, prefixParts);
    if (!projectedPrefix) return null;
    const visibleSources = Array.from(projectedPrefix.children?.values?.() || [])
      .map((node) => ({ node, bus: parseBusSegment(getSuffixTreeNodePathPart(node)) }))
      .filter(({ node, bus }) => bus && (node.notes || []).length > 0)
      .sort((a, b) => b.bus.number - a.bus.number);
    if (visibleSources.length === 0) return null;
    const fullScope = this.plugin.findBusScopeForKeywordPrefix(keyword.id, prefixParts);
    if (!fullScope) return null;
    const visibleSource = visibleSources[0].node.notes[0];
    return Object.assign({}, fullScope, {
      sourceNote: visibleSource,
      latestDescendantNote: visibleSource,
      dialogueProjected: true,
    });
  }

  renderBusActionIfAvailable(container, keyword, prefixParts, alignLevel = 0) {
    const scope = this.getRenderedBusScope(keyword, prefixParts);
    if (!scope) return;
    scope.originView = this;
    scope.originIndexPath = this.plugin.repository.indexPath;
    scope.originConfiguredPath = this.plugin.settings.indexPath;
    const row = container.createDiv({ cls: "kw-drawer-action-row" });
    const indent = Math.max(0, alignLevel) * 20;
    row.style.marginLeft = `${indent}px`;
    row.style.width = `calc(100% - ${indent}px)`;
    row.style.paddingLeft = "0";
    const btn = row.createEl("button", { cls: "kw-drawer-bus-btn", text: `➕ 顺延 ${scope.latestBusPart}` });
    btn.title = "预览并创建下一个 BUS 笔记";
    btn.onclick = (event) => {
      event.stopPropagation();
      new BusQuickCreateModal(this.plugin.app, this.plugin, scope, async (result) => {
        if (!result?.originViewRefreshed && this.prepareBusCreatedState(scope, result)) await this.refresh();
      }).open();
    };
  }

  isBusOriginCurrent(scope) {
    return !this.closed && !this.plugin.unloaded && scope.originView === this
      && scope.originIndexPath === this.plugin.repository.indexPath
      && scope.originConfiguredPath === this.plugin.settings.indexPath
      && this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_KEYWORD_INDEX).some((leaf) => leaf.view === this);
  }

  prepareBusCreatedState(scope, result) {
    if (!this.isBusOriginCurrent(scope)) return false;
    const nextPathParts = [...(scope.prefixParts || []), text(result?.nextBusPart)].filter(Boolean);
    this.query = "";
    this.collapsedIds.delete(scope.keywordId);
    this.notesOpenIds.add(scope.keywordId);
    for (let index = 1; index <= nextPathParts.length; index += 1) {
      this.drawerExpanded[buildDrawerStateKey(scope.keywordId, "yaml", nextPathParts.slice(0, index), "branch")] = true;
    }
    this.persistUiStateSoon();
    return true;
  }

  renderEvaRelationButton(container, nodeKey, title) {
    if (!nodeKey) return;
    const snapshot = this.plugin.getEvaRelationSnapshot(nodeKey);
    const outgoing = snapshot?.outgoing?.length || 0;
    const incoming = snapshot?.incoming?.length || 0;
    const total = outgoing + incoming;
    const commentEntry = this.plugin.getKeywordComment(nodeKey);
    const hasComment = hasKeywordCommentContent(commentEntry);
    const btn = container.createEl("button", {
      cls: `kw-eva-relation-btn kw-keyword-insight-btn${total > 0 ? " has-relations" : ""}${outgoing > 0 ? " has-outgoing" : ""}${incoming > 0 ? " has-incoming" : ""}${hasComment ? " has-keyword-comment" : ""}`,
      attr: { "aria-label": title || "关键词说明与 EVA 关系" }
    });
    btn.createSpan({ cls: "kw-eva-relation-icon", text: hasComment ? "💬" : "ⓘ" });
    if (total > 0) {
      btn.createSpan({ cls: "kw-eva-relation-count", text: String(total) });
      btn.title = `${title || "关键词说明与 EVA"}\n已有关系：${total}（出 ${outgoing} / 入 ${incoming}）${hasComment ? "\n已有关键词说明" : ""}`;
      container.addClass?.("has-eva-relations");
    } else {
      btn.title = `${title || "关键词说明与 EVA"}${hasComment ? "\n已有关键词说明" : ""}`;
    }
    if (hasComment) container.addClass?.("has-keyword-comment");
    btn.onclick = async (event) => {
      event.stopPropagation();
      this.plugin.openKeywordCommentModal(nodeKey);
    };
    const metaBtn = container.createEl("button", {
      cls: "kw-eva-meta-capture-btn eva-meta-capture-btn",
      text: "M",
      attr: { "aria-label": "EVA Meta 捕获关键词节点" },
    });
    metaBtn.title = "EVA Meta 捕获关键词节点";
    metaBtn.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const eva = this.plugin.getEvaMetaCaptureApi();
      if (!eva) {
        console.warn("[KeywordIndex][eva-meta.capture-unavailable]", { nodeKey });
        new Notice("EVA Meta 捕获未就绪");
        return;
      }
      if (!this.plugin.resolveIdentityNode(nodeKey)) { new Notice('该关键词身份暂不可用，请重新读取索引'); return; }
      const context = this.plugin.getKeywordCommentContext(nodeKey);
      const label = text(context?.label, context?.pathLabel, title, nodeKey);
      await eva.captureMetaNode({
        nodeKey,
        label,
        sourcePlugin: "keyword-index-plugin",
        viewType: KEYWORD_EVA_VIEW_TYPE,
      });
      console.info("[KeywordIndex][eva-meta.capture-click]", { nodeKey, label });
    };
  }

  renderNoteRow(container, note, type) {
    const row = container.createDiv({ cls: `kw-drawer-note type-${type}` });
    row.createSpan({ text: "📄" });
    row.createSpan({ text: note.name });
    row.title = `${note.path}${note.suffix ? `\n${note.suffix}` : ""}`;
    row.onclick = async (event) => {
      event.stopPropagation();
      logKeywordColorDebug(row, `note:${note.path}`);
      await this.openNote(note);
    };
  }
}

if (globalThis.__KEYWORD_INDEX_ONTOLOGY_TEST_HOOKS === true) {
  globalThis.__keywordIndexOntologyTestApi = Object.freeze({
    OntologyKeywordRepository,
    normalizeOntologyKeywordTarget,
    normalizeOntologyKeywordIndex,
    parseOntologyKeywordLabel,
  });
}

module.exports = class KeywordIndexPlugin extends Plugin {
  async loadIdentityModules() {
    const pluginDir = this.manifest.dir || `${this.app.vault.configDir || ".obsidian"}/plugins/${this.manifest.id}`;
    const load = async (filename, requiredMethods, allowCrypto = false) => {
      const modulePath = `${pluginDir.replace(/\/$/, "")}/${filename}`;
      try {
        const code = await this.app.vault.adapter.read(modulePath);
        const localModule = { exports: {} };
        const builtinRequire = (name) => {
          if (allowCrypto && name === "crypto") return require("crypto");
          throw new Error(`Module dependency not allowed: ${name}`);
        };
        const factory = new Function("module", "exports", "require", `"use strict";\n${code}\n;return module.exports;`);
        const loaded = factory(localModule, localModule.exports, builtinRequire);
        const missing = requiredMethods.filter((name) => typeof loaded?.[name] !== "function");
        if (missing.length) throw new Error(`Missing exports: ${missing.join(", ")}`);
        return loaded;
      } catch (error) {
        console.error("[KeywordIndex][identity.module-load-failed]", { modulePath, message: error?.message || String(error) });
        throw new Error(`Keyword identity module load failed (${modulePath}): ${error?.message || String(error)}`);
      }
    };
    const nextIdentity = await load("stable-identity.js", ["allocate", "copy", "descriptorKey", "find", "keywordIdsByLabel", "legacyKey", "moveSubtree", "nodeKey", "parseKey", "preview", "reconcile", "resolve", "upgrade", "validate"], true);
    const nextTransaction = await load("identity-transaction.js", ["assertSource", "execute", "recover"]);
    identity = nextIdentity;
    identityTransaction = nextTransaction;
  }

  async onload() {
    this.unloaded = false;
    await this.loadIdentityModules();
    await this.loadSettings();
    this.repository = new KeywordIndexRepository(this);
    this.ontologyKeywordRepository = new OntologyKeywordRepository(this);
    await this.ontologyKeywordRepository.load();
    this.ontologyKeywordProviderGeneration = `ontology-keyword-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    this.scanner = new KeywordIndexScanner(this);
    this.scanner.installSourceTracking();
    this.boundEvaChangedHandler = () => {
      this.handleEvaChangedRefresh().catch((error) => console.warn("[KeywordIndex][eva.changed-refresh-failed]", error));
    };
    this.boundReviewMetaChangedHandler = (event) => {
      console.debug("[KeywordIndex][review-meta.changed]", {
        reason: event?.detail?.reason || "",
        active: event?.detail?.state?.active === true,
        keywordCount: event?.detail?.state?.keywordCount || 0,
      });
      this.refreshReviewMetaOverlays();
    };
    this.autoScanTimer = null;

    this.registerView(VIEW_TYPE_KEYWORD_INDEX, (leaf) => new KeywordIndexView(leaf, this));
    window.__keywordIndexPluginApi = this.buildPublicApi();
    window.dispatchEvent?.(new CustomEvent("keyword-index:drawer-projection-changed"));
    window.dispatchEvent?.(new CustomEvent(ONTOLOGY_KEYWORD_READY_EVENT, { detail: {
      providerId: "keyword-index-plugin",
      providerGeneration: this.ontologyKeywordProviderGeneration,
      contractVersion: ONTOLOGY_KEYWORD_CONTRACT_VERSION,
      revision: this.ontologyKeywordRepository.getRevision(),
    } }));

    this.addRibbonIcon("tags", "Open Keyword Index", async () => {
      await this.activateView();
    });

    this.addCommand({
      id: "open-keyword-index",
      name: "Open Keyword Index",
      callback: async () => this.activateView(),
    });

    this.addCommand({
      id: "reveal-current-note-in-keyword-index",
      name: "在关键词索引中定位当前笔记",
      callback: async () => this.revealActiveFileKeywords(),
    });

    this.addCommand({
      id: "reload-keyword-index",
      name: "Reload Keyword Index JSON",
      callback: async () => {
        await this.repository.load();
        await this.refreshViews();
        new Notice("Keyword index reloaded.");
      },
    });

    this.addCommand({
      id: "scan-and-save-keyword-index",
      name: "Scan vault and update Keyword Index JSON",
      callback: async () => this.runManualKeywordScan("command"),
    });

    this.addCommand({
      id: "scan-and-verify-keyword-index",
      name: "完整校验关键词索引（重新读取全部笔记）",
      callback: async () => this.runManualKeywordScan("full"),
    });

    this.addCommand({ id: "upgrade-stable-keyword-identity", name: "预览并启用永久关键词身份", callback: () => this.upgradeStableIdentity().catch((error) => new Notice(error.message)) });
    this.addCommand({ id: "retry-stable-keyword-projection", name: "重试永久身份关系刷新", callback: () => this.publishIdentityChange("manual-retry") });
    this.addCommand({ id: "recover-stable-keyword-transaction", name: "恢复未完成身份事务", callback: () => this.recoverIdentityTransaction().catch((error) => new Notice(error.message)) });

    this.addSettingTab(new KeywordIndexSettingTab(this.app, this));
    window.addEventListener?.("eva-cross-view-relations:changed", this.boundEvaChangedHandler);
    window.addEventListener?.(REVIEW_META_EVENT, this.boundReviewMetaChangedHandler);
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (!(file instanceof TFile) || file.extension !== "md") return;
      this.scheduleAutoScanAfterRename(file.path, oldPath);
    }));
    this.registerEvaIntegrationSoon("onload");
  }

  onunload() {
    this.unloaded = true;
    this.scanner?.disposeSourceCache?.();
    this._manualScanNotice?.hide();
    this._manualScanNotice = null;
    this.navigationGeneration = (this.navigationGeneration || 0) + 1;
    window.dispatchEvent?.(new CustomEvent(ONTOLOGY_KEYWORD_UNAVAILABLE_EVENT, { detail: {
      providerId: "keyword-index-plugin",
      providerGeneration: this.ontologyKeywordProviderGeneration,
    } }));
    if (this.boundEvaChangedHandler) window.removeEventListener?.("eva-cross-view-relations:changed", this.boundEvaChangedHandler);
    if (this.boundReviewMetaChangedHandler) window.removeEventListener?.(REVIEW_META_EVENT, this.boundReviewMetaChangedHandler);
    this.unregisterEvaIntegration();
    if (window.__keywordIndexPluginApi === this.api) delete window.__keywordIndexPluginApi;
    window.dispatchEvent?.(new CustomEvent("keyword-index:drawer-projection-changed"));
    if (this._evaRegisterTimer) window.clearTimeout(this._evaRegisterTimer);
    if (this._uiStateSaveTimer) {
      window.clearTimeout(this._uiStateSaveTimer);
      this._uiStateSaveTimer = null;
      this.saveSettings().catch((error) => console.error("[KeywordIndex][ui-state.unload-save-failed]", error));
    }
    if (this.autoScanTimer) {
      window.clearTimeout(this.autoScanTimer);
      this.autoScanTimer = null;
    }
    this.app.workspace.getLeavesOfType(VIEW_TYPE_KEYWORD_INDEX).forEach((leaf) => leaf.detach());
  }

  runManualKeywordScan(reason) {
    if (this.unloaded) return Promise.resolve(null);
    if (this._manualScanPromise) {
      if (reason === "full" && this._manualScanReason !== "full") {
        new Notice("完整校验已排队，将在当前扫描结束后执行。");
        return this._manualScanPromise.then(() => this.runManualKeywordScan("full"));
      }
      new Notice("关键词扫描正在进行，已合并本次请求。");
      return this._manualScanPromise;
    }
    const notice = new Notice("关键词扫描：等待当前操作完成…", 0);
    this._manualScanNotice = notice;
    const labels = { queued: "等待当前操作完成…", read: "读取笔记", reconcile: "核对关键词身份（如有对账窗口，请确认）", revalidate: "复核笔记来源", save: "保存索引并更新关联…", refresh: "刷新关键词视图…", complete: "完成" };
    let lastPhase = "", lastUpdate = 0;
    const progress = (state) => {
      if (this.unloaded) return;
      const now = Date.now();
      if (state.phase === lastPhase && now - lastUpdate < 100 && state.completed !== state.total) return;
      lastPhase = state.phase; lastUpdate = now;
      const count = Number.isFinite(state.total) ? ` ${state.completed.toLocaleString()} / ${state.total.toLocaleString()}` : "";
      const reuse = Number.isFinite(state.reusedCount) ? `（读取 ${state.readCount}，复用 ${state.reusedCount}）` : "";
      notice.setMessage(`关键词扫描：${labels[state.phase] || state.phase}${count}${reuse}`);
    };
    // Assign the single-flight promise before any scanner callback can fail synchronously.
    const job = Promise.resolve().then(async () => {
      if (this.unloaded) return null;
      try {
        const result = await this.scanner.scanAndSave(reason, progress);
        if (!this.unloaded) new Notice(result.cancelled ? "身份对账已取消，未写入" : `${result.unchanged ? "关键词核对完成，索引无变化" : "关键词索引已更新"}：${result.keywordCount} 个关键词，${result.fileCount} 个文件`);
        return result;
      } catch (error) {
        console.error("[KeywordIndex][scan.manual-failed]", { reason, error });
        if (!this.unloaded) new Notice(`扫描写入失败：${error?.message || String(error)}`);
        return null;
      }
    }).finally(() => {
      notice.hide();
      if (this._manualScanNotice === notice) this._manualScanNotice = null;
      if (this._manualScanPromise === job) this._manualScanPromise = null;
    });
    this._manualScanPromise = job;
    this._manualScanReason = reason;
    return job;
  }

  scheduleAutoScanAfterRename(newPath, oldPath) {
    if (this.settings.autoSyncOnRename === false) return;
    const scanFolder = text(this.settings.scanFolder).replace(/\\/g, "/");
    if (scanFolder) {
      const prefix = scanFolder.endsWith("/") ? scanFolder : `${scanFolder}/`;
      const inScope = text(newPath).startsWith(prefix) || text(oldPath).startsWith(prefix);
      if (!inScope) return;
    }
    if (this.autoScanTimer) window.clearTimeout(this.autoScanTimer);
    this.autoScanTimer = window.setTimeout(async () => {
      this.autoScanTimer = null;
      try {
        const result = await this.scanner.scanAndSave("rename");
        console.info("[KeywordIndex][rename.auto-scan-ok]", { oldPath, newPath, keywords: result.keywordCount, backupPath: result.backupPath });
      } catch (error) {
        console.error("[KeywordIndex][rename.auto-scan-failed]", { oldPath, newPath, error });
        new Notice(`关键词索引自动更新失败：${error.message}`);
      }
    }, 1200);
  }

  buildPublicApi() {
    this.api = {
      version: "0.1.10",
      ontologyKeywordIndex: Object.freeze({
        contractVersion: ONTOLOGY_KEYWORD_CONTRACT_VERSION,
        indexVersion: ONTOLOGY_KEYWORD_INDEX_VERSION,
        providerId: "keyword-index-plugin",
        providerGeneration: this.ontologyKeywordProviderGeneration,
        listKeywords: (options = {}) => this.ontologyKeywordRepository.list(options),
        listKeywordsForTarget: (target, options = {}) => this.ontologyKeywordRepository.listForTarget(target, options),
        createKeyword: async (input = {}) => await this.ontologyKeywordRepository.create(input),
        updateKeyword: async (id, patch = {}) => await this.ontologyKeywordRepository.update(id, patch),
        removeKeyword: async (id, options = {}) => {
          if (options?.confirmed !== true) throw new Error("删除 Ontology 关键词需要显式确认。");
          return await this.ontologyKeywordRepository.remove(id, options.reason);
        },
        rebindKeyword: async (id, target, patch = {}) => {
          if (patch?.confirmed !== true) throw new Error("改绑 Ontology 关键词需要显式确认。");
          return await this.ontologyKeywordRepository.rebind(id, target, patch);
        },
        getRevision: () => this.ontologyKeywordRepository.getRevision(),
        getDiagnostics: () => this.ontologyKeywordRepository.getDiagnostics(),
      }),
      openNode: async (nodeKey) => await this.openEvaNode(nodeKey),
      identityContractVersion: 1,
      drawerProjectionContractVersion: 1,
      getDrawerProjection: (options = {}) => this.getDrawerProjection(options),
      resolveKeywordNodeKey: ({ keywordId, indexPath } = {}) => {
        if (this.repository.lastError || !this.repository.index.identityRegistry || (indexPath && indexPath !== this.repository.indexPath)) return "";
        return this.buildKeywordNodeKey(keywordId);
      },
      resolveDrawerNodeKey: ({ keywordId, type = "yaml", scope = "branch", pathParts = [], indexPath } = {}) => {
        if (this.repository.lastError || !this.repository.index.identityRegistry || (indexPath && indexPath !== this.repository.indexPath)) return "";
        return this.buildKeywordDrawerNodeKey(keywordId, type, pathParts, scope);
      },
      getKeywordNotesForNode: async (nodeKey) => await this.getKeywordNotesForNode(nodeKey),
      getKeywordNotesForNodes: async (nodeKeys) => await this.getKeywordNotesForNodes(nodeKeys),
      openKeywordNote: async (noteOrPath) => await this.openKeywordNote(noteOrPath),
      openKeywordNoteAtTabEnd: async (noteOrPath, sourceLeaf) => await this.openKeywordNote(noteOrPath, { placement: "source-tab-end", sourceLeaf }),
      openView: async () => {
        await this.activateView();
        return true;
      },
      revealKeywordById: async (keywordId, options = {}) => await this.revealKeywordById(keywordId, options),
      revealActiveFileKeywords: async () => await this.revealActiveFileKeywords(),
      listEvaItems: () => this.listEvaItems(),
      refreshEvaAdapter: async () => await this.refreshEvaAdapter(),
    };
    return this.api;
  }

  emitOntologyKeywordChanged(detail = {}) {
    window.dispatchEvent?.(new CustomEvent(ONTOLOGY_KEYWORD_CHANGED_EVENT, { detail: Object.assign({
      providerId: "keyword-index-plugin",
      providerGeneration: this.ontologyKeywordProviderGeneration,
      contractVersion: ONTOLOGY_KEYWORD_CONTRACT_VERSION,
      revision: this.ontologyKeywordRepository?.getRevision?.() || 0,
    }, detail) }));
  }

  getKeywordNotesForParsedNode(parsed, keyword, nodeKey = "") {
    if (!parsed || !keyword) return [];
    let notes = [];
    if (parsed.scopeType === "keyword") {
      notes = Array.isArray(keyword.notes) ? keyword.notes : [];
    } else if (parsed.scopeType === "keyword-drawer") {
      const drawer = parsed.identityRecord || decodeKeywordDrawerItemId(parsed.itemId);
      const sourceNotes = (keyword.notes || []).filter((note) => text(note.sourceType, keyword.type) === drawer.type);
      const tree = buildSuffixTree(sourceNotes);
      const node = findSuffixTreeNodeByPath(tree, drawer.pathParts);
      notes = drawer.scope === "root-notes" ? (node?.notes || []) : collectTreeNotes(node);
    }
    const keywordLabel = text(keyword.displayText, keyword.baseKeyword);
    const keywordPath = this.getKeywordPathLabel(keyword);
    return notes
      .map(normalizeKeywordNote)
      .filter((note) => note.path)
      .map((note) => ({
        ...note,
        keywordId: keyword.id,
        keywordLabel,
        keywordPath,
        nodeKey: text(nodeKey),
      }));
  }

  async getKeywordNotesForNode(nodeKey) {
    // r35: read-only lookup; reuse the parsed index when the file text is unchanged.
    await this.repository.load({ reuseUnchanged: true });
    const parsed = this.resolveIdentityNode(nodeKey);
    if (!parsed) return [];
    const keyword = this.repository.index.keywords?.[parsed.scopeId];
    return this.getKeywordNotesForParsedNode(parsed, keyword, nodeKey);
  }

  // r37 K3: notes for many nodes from one index load (one snapshot per navigation build). The only await is the load;
  // the loop is synchronous. Same resolution as getKeywordNotesForNode for every key.
  async getKeywordNotesForNodes(nodeKeys = []) {
    await this.repository.load({ reuseUnchanged: true });
    const out = new Map();
    for (const nodeKey of Array.isArray(nodeKeys) ? nodeKeys : []) {
      if (out.has(nodeKey)) continue;
      const parsed = this.resolveIdentityNode(nodeKey);
      out.set(nodeKey, parsed ? this.getKeywordNotesForParsedNode(parsed, this.repository.index.keywords?.[parsed.scopeId], nodeKey) : []);
    }
    return out;
  }

  async openKeywordNote(noteOrPath, options = {}) {
    const path = typeof noteOrPath === "string" ? text(noteOrPath) : text(noteOrPath?.path);
    if (!path) return false;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      if (options.placement === "source-tab-end") {
        const workspace = this.app.workspace;
        const sourceLeaf = options.sourceLeaf;
        const parent = sourceLeaf?.parent;
        let registered = false;
        let siblingCount = 0;
        if (parent && typeof workspace.iterateAllLeaves === "function" && typeof workspace.createLeafInParent === "function") {
          workspace.iterateAllLeaves(leaf => {
            if (leaf === sourceLeaf) registered = true;
            if (leaf.parent === parent) siblingCount += 1;
          });
        }
        if (!registered) {
          new Notice("无法在标签末尾打开 Note：来源视图已关闭或标签接口不可用。");
          return false;
        }
        const leaf = workspace.createLeafInParent(parent, siblingCount);
        await leaf.openFile(file, { active: true });
        return true;
      }
      await this.app.workspace.getLeaf("tab").openFile(file);
      return true;
    }
    new Notice(`Note not found: ${path}`);
    return false;
  }

  activateLeaf(leaf, focus = false) {
    if (!leaf || typeof this.app.workspace.setActiveLeaf !== "function") return false;
    try {
      this.app.workspace.setActiveLeaf(leaf, { focus });
      return true;
    } catch (error) {
      try {
        this.app.workspace.setActiveLeaf(leaf, focus);
        return true;
      } catch (innerError) {
        console.warn("[KeywordIndex][leaf.activate-failed]", { error: innerError || error });
      }
    }
    return false;
  }

  async openFileInLastMarkdownTabGroup(file, reason = "") {
    if (!(file instanceof TFile)) return null;
    const markdownLeaves = this.app.workspace.getLeavesOfType("markdown")
      .filter((leaf) => leaf?.view?.file instanceof TFile);
    const anchorLeaf = markdownLeaves[markdownLeaves.length - 1] || null;
    const anchored = anchorLeaf ? this.activateLeaf(anchorLeaf, false) : false;
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    console.info("[KeywordIndex][file.open-last-markdown-tab]", {
      path: file.path,
      reason: text(reason),
      anchored,
      anchorPath: anchorLeaf?.view?.file?.path || "",
    });
    return leaf;
  }

  getKeywordRefsFromFileCache(file) {
    if (!(file instanceof TFile)) return [];
    const cache = this.app.metadataCache.getFileCache(file);
    const refs = [];
    const addRef = (raw, sourceType = "yaml") => {
      const parsed = parseKeywordWithSuffix(raw);
      if (!parsed?.baseKeyword) return;
      refs.push({ baseKeyword: parsed.baseKeyword, suffix: parsed.suffix, sourceType: text(sourceType, parsed.type || "yaml") });
    };
    normalizeKeywordListValue(cache?.frontmatter?.["关键词管理"]).forEach((raw) => addRef(raw, "yaml"));
    const fileName = text(file.basename);
    let match;
    const plusRegex = /\+\+(.+?)\+\+/g;
    while ((match = plusRegex.exec(fileName)) !== null) addRef(match[1], "plus");
    const dotRegex = /··([^·]+)··/g;
    while ((match = dotRegex.exec(fileName)) !== null) addRef(match[1], "dot");
    const seen = new Set();
    return refs.filter((ref) => {
      const key = `${ref.baseKeyword}::${ref.suffix}::${ref.sourceType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getKeywordTextsFromFileCache(file) {
    return this.getKeywordRefsFromFileCache(file).map((ref) => ref.baseKeyword);
  }

  findKeywordMatchesForNotePath(notePath, preferredRefs = []) {
    const path = text(notePath);
    const preferred = new Set((preferredRefs || []).map((ref) => text(ref?.baseKeyword || ref)).filter(Boolean));
    const keywords = this.repository?.index?.keywords || {};
    const matches = [];
    Object.values(keywords).forEach((keyword) => {
      (keyword.notes || []).forEach((note) => {
        if (text(note.path) !== path) return;
        matches.push({ keyword, note });
      });
    });
    matches.sort((a, b) => {
      const aPreferred = preferred.has(text(a.keyword.baseKeyword, a.keyword.displayText)) || preferred.has(text(a.keyword.displayText, a.keyword.baseKeyword));
      const bPreferred = preferred.has(text(b.keyword.baseKeyword, b.keyword.displayText)) || preferred.has(text(b.keyword.displayText, b.keyword.baseKeyword));
      if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
      return compareKeywordByPinyin(a.keyword, b.keyword);
    });
    return matches;
  }

  findKeywordsForNotePath(notePath, preferredTexts = []) {
    return this.findKeywordMatchesForNotePath(notePath, preferredTexts).map((match) => match.keyword);
  }

  uniqueKeywordMatches(matches = []) {
    const seen = new Set();
    return (matches || []).filter((match) => {
      const keyword = match?.keyword;
      if (!keyword?.id) return false;
      const note = match?.note || {};
      const key = [keyword.id, text(note.path), text(note.suffix), text(note.sourceType, keyword.type)].join("::");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  chooseKeywordRevealMatch(matches = []) {
    const choices = this.uniqueKeywordMatches(matches);
    if (choices.length <= 1) return Promise.resolve(choices[0] || null);
    return new Promise((resolve) => {
      new KeywordRevealChoiceModal(this.app, choices, resolve).open();
    });
  }

  async revealKeywordById(keywordId, options = {}) {
    return this.revealKeywordTarget({ keywordId: text(keywordId), openNotes: options.openNotes !== false });
  }

  buildDrawerNodeKeyForKeywordNote(keyword, note) {
    if (!keyword || !note) return "";
    const type = text(note.sourceType, keyword.type || "yaml");
    const pathParts = splitSuffixParts(note.suffix);
    if (pathParts.length > 0) return this.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "branch");
    return this.buildKeywordDrawerNodeKey(keyword.id, type, [], "root-notes");
  }

  async revealKeywordMatch(match, options = {}) {
    const keyword = match?.keyword || match;
    const note = match?.note || null;
    if (!keyword?.id) return false;
    const drawerNodeKey = this.buildDrawerNodeKeyForKeywordNote(keyword, note);
    if (drawerNodeKey && note) {
      const expectedGeneration = (this.navigationGeneration || 0) + 1;
      const ok = await this.openEvaNode(drawerNodeKey);
      if (this.unloaded || this.navigationGeneration !== expectedGeneration) return false;
      if (ok) {
        console.info("[KeywordIndex][active-note.reveal-drawer]", {
          keywordId: keyword.id,
          suffix: text(note.suffix),
          sourceType: text(note.sourceType, keyword.type),
          reason: text(options.reason),
        });
        return true;
      }
    }
    return await this.revealKeywordById(keyword.id, options);
  }

  async revealActiveFileKeywords() {
    const generation = this.navigationGeneration = (this.navigationGeneration || 0) + 1;
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== "md") {
      new Notice("当前没有可定位的 Markdown 笔记");
      return { ok: false, reason: "no-active-markdown-file" };
    }
    await this.repository.load();
    if (this.unloaded || generation !== this.navigationGeneration) return { ok: false, reason: "cancelled" };
    const keywordRefs = this.getKeywordRefsFromFileCache(file);
    let matches = keywordRefs
      .map((ref) => {
        const keyword = Object.values(this.repository.index.keywords || {}).find((item) => item.identityStatus !== "unavailable" && item.baseKeyword === ref.baseKeyword);
        if (!keyword) return null;
        const exactNote = (keyword.notes || []).find((note) =>
          text(note.path) === file.path
          && text(note.suffix) === text(ref.suffix)
          && text(note.sourceType, keyword.type) === text(ref.sourceType)
        );
        return { keyword, note: exactNote || { path: file.path, suffix: ref.suffix, sourceType: ref.sourceType } };
      })
      .filter(Boolean);
    if (!matches.length) matches = this.findKeywordMatchesForNotePath(file.path, keywordRefs);
    matches = this.uniqueKeywordMatches(matches);
    const match = await this.chooseKeywordRevealMatch(matches);
    if (this.unloaded || generation !== this.navigationGeneration) return { ok: false, reason: "cancelled" };
    const keyword = match?.keyword || null;
    const keywordTexts = keywordRefs.map((ref) => ref.baseKeyword);
    if (!keyword) {
      const reason = matches.length ? "cancelled" : "no-keyword-match";
      if (!matches.length) new Notice("当前笔记没有在关键词索引中找到对应关键词");
      console.info("[KeywordIndex][active-note.reveal-miss]", { path: file.path, keywordRefs, reason });
      return { ok: false, reason, path: file.path, keywordRefs };
    }
    const ok = await this.revealKeywordMatch(match, { reason: "active-note", openNotes: true });
    if (ok) new Notice(`已定位关键词：${text(keyword.displayText, keyword.baseKeyword)}`);
    return { ok, keywordId: keyword.id, path: file.path, keywordRefs, suffix: text(match?.note?.suffix) };
  }

  getEvaAdapterId() {
    return `${KEYWORD_EVA_VIEW_TYPE}::${text(this.settings?.indexPath, DEFAULT_SETTINGS.indexPath)}`;
  }

  registerEvaIntegrationSoon(reason = "register") {
    if (this._evaRegisterTimer) window.clearTimeout(this._evaRegisterTimer);
    this._evaRegisterTimer = window.setTimeout(() => {
      this._evaRegisterTimer = null;
      this.registerEvaIntegration(reason).catch((error) => console.warn("[KeywordIndex][eva.register-failed]", { reason, error }));
    }, 250);
  }

  async registerEvaIntegration(reason = "register") {
    const eva = window.evaCrossViewRelations;
    if (!eva || typeof eva.registerAdapter !== "function") {
      console.debug("[KeywordIndex][eva.register-deferred]", { reason, hasEva: !!eva });
      return false;
    }
    // BUS already reloaded the committed snapshot; still compare fresh source bytes.
    await this.repository.load({ reuseUnchanged: !!this.busViewRefreshBatch });
    // Never replace the saved EVA inventory before the explicit identity upgrade.
    if (this.repository.lastError || !this.repository.index.identityRegistry) return false;
    const adapterId = this.getEvaAdapterId();
    let itemCount = null, inventoryError = null;
    await eva.registerAdapter({
      adapterId,
      viewType: KEYWORD_EVA_VIEW_TYPE,
      viewLabel: KEYWORD_EVA_VIEW_LABEL,
      notePath: text(this.settings.indexPath, DEFAULT_SETTINGS.indexPath),
      listItems: () => {
        try {
          const items = this.listEvaItems();
          itemCount = items.length; inventoryError = null;
          return items;
        } catch (error) {
          inventoryError = error;
          throw error;
        }
      },
      openNode: async (nodeKey) => await this.openEvaNode(nodeKey),
    });
    // EVA may catch listItems failures internally; do not report that projection as published.
    if (inventoryError) throw inventoryError;
    this.evaAdapterId = adapterId;
    console.info("[KeywordIndex][eva.registered]", { adapterId, reason, items: itemCount });
    return true;
  }

  unregisterEvaIntegration() {
    const eva = window.evaCrossViewRelations;
    const adapterId = this.evaAdapterId || this.getEvaAdapterId();
    if (eva && typeof eva.unregisterAdapter === "function") eva.unregisterAdapter(adapterId);
  }

  async refreshEvaAdapter() {
    this.drawerProjectionCache = null;
    window.dispatchEvent?.(new CustomEvent("keyword-index:drawer-projection-changed"));
    const eva = window.evaCrossViewRelations;
    if (!eva || typeof eva.refreshAdapter !== "function") return false;
    const adapterId = this.evaAdapterId || this.getEvaAdapterId();
    await eva.refreshAdapter(adapterId);
    return true;
  }

  getEvaRelationSnapshot(nodeKey) {
    const eva = window.evaCrossViewRelations;
    if (!eva || typeof eva.getNodeRelationSnapshot !== "function") return null;
    try {
      return eva.getNodeRelationSnapshot(nodeKey);
    } catch (error) {
      console.warn("[KeywordIndex][eva.snapshot-failed]", { nodeKey, error });
      return null;
    }
  }

  getEvaMetaCaptureApi() {
    const evaPlugin = this.app?.plugins?.plugins?.["eva-cross-view-relations"];
    const candidates = [
      typeof window !== "undefined" ? window.evaCrossViewRelations : null,
      evaPlugin?.api,
      evaPlugin,
    ];
    return candidates.find((api) => api && typeof api.captureMetaNode === "function") || null;
  }

  getDailyReviewMetaApi() {
    const plugin = this.app?.plugins?.plugins?.["daily-note-review"];
    const candidates = [
      typeof window !== "undefined" ? window.__dailyNoteReviewPluginApi : null,
      plugin?.api,
      plugin,
    ];
    return candidates.find((api) => api && typeof api.getReviewMetaState === "function") || null;
  }

  isDailyReviewMetaActive() {
    const api = this.getDailyReviewMetaApi();
    try {
      if (api && typeof api.isReviewMetaActive === "function") return api.isReviewMetaActive() === true;
      return api?.getReviewMetaState?.()?.active === true;
    } catch (error) {
      console.warn("[KeywordIndex][review-meta.state-failed]", error);
      return false;
    }
  }

  getDailyReviewMetaSnapshot() {
    const api = this.getDailyReviewMetaApi();
    try {
      return api?.getReviewMetaSnapshot?.() || api?.getReviewMetaState?.()?.snapshot || null;
    } catch (error) {
      console.warn("[KeywordIndex][review-meta.snapshot-failed]", error);
      return null;
    }
  }

  refreshReviewMetaOverlays() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_KEYWORD_INDEX)) {
      const view = leaf?.view;
      if (view instanceof KeywordIndexView) view.scheduleReviewMetaOverlayRefresh();
    }
  }

  async openEvaRelationEditor(nodeKey) {
    await this.registerEvaIntegration("open-relation");
    const eva = window.evaCrossViewRelations;
    if (!eva || typeof eva.openRelationEditor !== "function") {
      new Notice("⚠️ EVA Cross View Relations 未加载，无法打开关联编辑器");
      return false;
    }
    if (typeof eva.markLastFocusedNode === "function") eva.markLastFocusedNode(nodeKey);
    await eva.openRelationEditor(nodeKey);
    return true;
  }

  openKeywordCommentModal(nodeKey) {
    if (!text(nodeKey)) return false;
    new KeywordCommentModal(this.app, this, nodeKey).open();
    return true;
  }

  getKeywordComment(nodeKey) {
    return normalizeKeywordCommentEntry(this.settings.keywordComments?.[text(nodeKey)]) || {};
  }

  async saveKeywordComment(nodeKey, patch = {}) {
    const key = text(nodeKey);
    if (!key) return false;
    const comments = normalizeKeywordComments(this.settings.keywordComments);
    const existing = comments[key] || {};
    const next = normalizeKeywordCommentEntry({
      ...existing,
      comment: text(patch.comment),
      guide: text(patch.guide),
      references: text(patch.references),
      keywordId: text(patch.keywordId, existing.keywordId),
      label: text(patch.label, existing.label),
      nodeKind: text(patch.nodeKind, existing.nodeKind),
      updatedAt: nowString(),
    });
    if (next) comments[key] = next;
    else delete comments[key];
    this.settings.keywordComments = comments;
    await this.saveSettings();
    await this.refreshViews();
    return true;
  }

  getKeywordCommentContext(nodeKey) {
    const parsed = this.resolveIdentityNode(nodeKey);
    const keywords = this.repository?.index?.keywords || {};
    const keyword = parsed ? keywords[parsed.scopeId] : null;
    if (!parsed || !keyword) return { label: "关键词节点", pathLabel: "", nodeKind: "", noteCount: null };
    const keywordLabel = text(keyword.displayText, keyword.baseKeyword);
    const keywordPath = this.getKeywordPathLabel(keyword);
    if (parsed.scopeType === "keyword") {
      return {
        keywordId: keyword.id,
        label: keywordLabel,
        pathLabel: keywordPath,
        nodeKind: "关键词胶囊",
        noteCount: (keyword.notes || []).length,
      };
    }
    const drawer = parsed.identityRecord || decodeKeywordDrawerItemId(parsed.itemId);
    const displayPathParts = getTreePathDisplayParts(drawer.pathParts);
    const lastRawPart = text(drawer.pathParts[drawer.pathParts.length - 1]);
    const lastSubconcept = parseSubconceptSegment(lastRawPart);
    const pathLabel = [keywordPath, ...displayPathParts, drawer.scope === "root-notes" ? "根笔记" : ""].filter(Boolean).join(" / ");
    return {
      keywordId: keyword.id,
      label: drawer.scope === "root-notes" ? "根笔记" : text(lastSubconcept?.label, text(lastRawPart, keywordLabel)),
      pathLabel,
      nodeKind: drawer.scope === "root-notes" ? "根笔记抽屉" : lastSubconcept ? "关键词子概念" : "关键词抽屉",
      noteCount: this.countKeywordDrawerNotes(keyword, drawer.type, drawer.pathParts, drawer.scope),
    };
  }

  countKeywordDrawerNotes(keyword, type, pathParts = [], scope = "branch") {
    const notes = (keyword?.notes || []).filter((note) => text(note.sourceType, keyword.type) === type);
    const tree = buildSuffixTree(notes);
    const node = findSuffixTreeNodeByPath(tree, pathParts);
    if (!node) return 0;
    if (scope === "root-notes") return (node.notes || []).length;
    return countTreeNotes(node);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!Array.isArray(this.settings.evaNoteCandidatePaths)) {
      this.settings.evaNoteCandidatePaths = [...DEFAULT_SETTINGS.evaNoteCandidatePaths];
    }
    this.settings.keywordComments = normalizeKeywordComments(this.settings.keywordComments);
    this.settings.uiState = Object.assign({}, DEFAULT_SETTINGS.uiState, this.settings.uiState || {});
    this.settings.uiState.capsuleExpanded = normalizeAnyBooleanMap(this.settings.uiState.capsuleExpanded);
    this.settings.uiState.notesDrawerOpen = normalizeBooleanMap(this.settings.uiState.notesDrawerOpen);
    this.settings.uiState.drawerExpanded = this.normalizeDrawerExpandedMap(this.settings.uiState.drawerExpanded);
    this.settings.uiState.keywordViewMode = normalizeKeywordViewMode(this.settings.uiState.keywordViewMode);
    this.settings.autoSyncOnRename = this.settings.autoSyncOnRename !== false;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  normalizeDrawerExpandedMap(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const out = {};
    Object.entries(value).forEach(([key, expanded]) => {
      if (expanded === true || expanded === false) out[text(key)] = expanded;
    });
    return out;
  }

  getDescendantIds(keywordId, keywords = this.repository.index.keywords) {
    const descendants = [];
    const visit = (parentId) => {
      Object.values(keywords || {}).forEach((keyword) => {
        if (text(keyword.parentId) === text(parentId)) {
          descendants.push(keyword.id);
          visit(keyword.id);
        }
      });
    };
    visit(keywordId);
    return descendants;
  }

  buildKeywordNodeKey(keywordId) {
    const registry = this.repository?.index?.identityRegistry;
    if (registry) return identity.find(registry, { kind: "keyword", keywordId, type: "", scope: "", pathParts: [] })?.nodeKey || "";
    return buildKeywordEvaNodeKey(text(this.settings.indexPath, DEFAULT_SETTINGS.indexPath), "keyword", text(keywordId), "capsule");
  }

  buildKeywordDrawerNodeKey(keywordId, type, pathParts = [], scope = "branch") {
    const registry = this.repository?.index?.identityRegistry;
    if (registry) return identity.find(registry, { kind: "drawer", keywordId, type, scope, pathParts })?.nodeKey || "";
    return buildKeywordEvaNodeKey(text(this.settings.indexPath, DEFAULT_SETTINGS.indexPath), "keyword-drawer", text(keywordId), encodeKeywordDrawerItemId(type, scope, pathParts));
  }

  resolveIdentityNode(nodeKey) {
    if (this.repository.lastError) return null;
    const registry = this.repository.index.identityRegistry;
    if (!registry) return parseKeywordEvaNodeKey(nodeKey);
    const record = identity.resolve(registry, nodeKey);
    if (!record) return null;
    return { scopeId: record.keywordId, scopeType: record.kind === "keyword" ? "keyword" : "keyword-drawer", itemId: encodeKeywordDrawerItemId(record.type, record.scope, record.pathParts), identityRecord: record };
  }

  requireIdentityRegistry(raw) {
    if (!raw.identityRegistry) throw new Error("请先运行“预览并启用永久关键词身份”，旧 ID 不会被替换。");
    return identity.validate(raw.identityRegistry);
  }

  withIdentityMutation(action, { recovery = false } = {}) {
    const run = (this._identityQueue || Promise.resolve()).catch(() => {}).then(async () => {
      if (!recovery && await this.app.vault.adapter.exists(this.repository.indexPath + ".identity-pending.json")) throw new Error("已有未完成身份事务，请先运行“恢复未完成身份事务”");
      return action();
    });
    this._identityQueue = run;
    return run;
  }

  identityDescriptors(keywords) {
    const out = [];
    for (const keyword of Object.values(keywords)) {
      if (keyword.identityStatus === "unavailable") continue;
      out.push({ kind: "keyword", keywordId: keyword.id, type: "", scope: "", pathParts: [] });
      for (const type of ["yaml", "plus", "dot"]) {
        const notes = (keyword.notes || []).filter((note) => text(note.sourceType, keyword.type) === type);
        const visit = (node, pathParts) => {
          if (pathParts.length) out.push({ kind: "drawer", keywordId: keyword.id, type, scope: "branch", pathParts });
          if (node.notes?.length && (node.children?.size || node.subconcepts?.size)) out.push({ kind: "drawer", keywordId: keyword.id, type, scope: "root-notes", pathParts });
          for (const child of node.children.values()) visit(child, [...pathParts, child.label]);
          for (const child of node.subconcepts?.values?.() || []) visit(child, [...pathParts, getSubconceptRawPathPart(child)]);
        };
        visit(buildSuffixTree(notes), []);
      }
    }
    return out;
  }

  confirmIdentityPreview(title, summary, rows = []) {
    return new Promise((resolve) => {
      let result = null;
      const modal = new Modal(this.app);
      modal.onOpen = () => {
        modal.contentEl.createEl("h3", { text: title });
        modal.contentEl.createEl("p", { text: summary });
        const selections = new Map();
        for (const row of rows) {
          const container = modal.contentEl.createDiv();
          container.createEl("p", { text: row.label });
          const select = container.createEl("select");
          select.createEl("option", { value: "", text: "保留为不可用；不认定改名/移动" });
          for (const choice of row.choices) select.createEl("option", { value: choice.value, text: choice.label });
          selections.set(row.key, select);
        }
        const apply = modal.contentEl.createEl("button", { text: "确认预览并保存" });
        apply.onclick = () => { result = Object.fromEntries([...selections].filter(([, select]) => select.value).map(([key, select]) => [key, select.value])); modal.close(); };
        modal.contentEl.createEl("button", { text: "取消，不写入" }).onclick = () => modal.close();
      };
      modal.onClose = () => resolve(result);
      modal.open();
    });
  }

  async upgradeStableIdentity() {
    return this.withIdentityMutation(async () => {
      const { indexPath, raw, rawText } = await this.loadRawIndexForWrite();
      if (raw.identityRegistry) { this.requireIdentityRegistry(raw); new Notice("永久身份已启用，无需重复升级"); return false; }
      const eva = window.evaCrossViewRelations;
      if (typeof eva?.getIdentityInventory !== "function") throw new Error("请先加载支持完整身份快照的 EVA；未进行升级或写入");
      const snapshot = eva.getIdentityInventory(KEYWORD_EVA_VIEW_TYPE);
      if (!snapshot?.complete) throw new Error("EVA 身份快照不完整，停止升级");
      const history = [...snapshot.nodeKeys, ...Object.keys(this.settings.keywordComments || {})];
      const descriptors = this.identityDescriptors(raw.keywords);
      const registry = identity.upgrade(raw, descriptors, history, indexPath);
      if (JSON.stringify(registry) !== JSON.stringify(identity.upgrade(raw, descriptors, history, indexPath))) throw new Error("升级预览不确定");
      const accepted = await this.confirmIdentityPreview("启用永久关键词身份", `保留 ${Object.keys(raw.keywords).length} 个 Keyword ID、${registry.nodes.length} 个端点；其中 ${registry.nodes.filter((n) => n.status === "unavailable").length} 个历史端点暂不可用。EVA relationId、端点及 POE/SuperMemo 附属内容不迁移。`);
      if (!accepted) return false;
      if (JSON.stringify(eva.getIdentityInventory(KEYWORD_EVA_VIEW_TYPE)) !== JSON.stringify(snapshot)) throw new Error("EVA 快照已变化，请重新预览");
      if (Object.keys(this.settings.keywordComments || {}).some((key) => !history.includes(key))) throw new Error("关键词评论已变化，请重新预览");
      raw.identityRegistry = registry;
      await this.safeWriteKeywordIndex(indexPath, raw, `identity-upgrade-${Date.now()}`, rawText);
      await this.repository.load();
      await this.publishIdentityChange("identity-upgrade");
      await this.refreshViews();
      return true;
    });
  }

  keywordMapSignature(map) {
    return JSON.stringify([...map.entries()].map(([label, entry]) => [label, entry.type, [...entry.notes].map((note) => [note.path, note.name, note.suffix, note.sourceType]).sort()]).sort());
  }

  async prepareIdentityScan(keywordMap, raw, reason) {
    const oldKeywords = identity.copy(raw.keywords);
    const byLabel = identity.keywordIdsByLabel(oldKeywords);
    const newLabels = [...keywordMap.keys()].filter((label) => !byLabel.has(label));
    const structuralAncestors = new Set();
    for (const label of keywordMap.keys()) {
      let parentId = oldKeywords[byLabel.get(label)]?.parentId;
      const seen = new Set();
      while (parentId && oldKeywords[parentId] && !seen.has(parentId)) {
        seen.add(parentId); structuralAncestors.add(parentId);
        parentId = oldKeywords[parentId].parentId;
      }
    }
    const absent = Object.values(oldKeywords).filter((keyword) => !structuralAncestors.has(keyword.id) && (keyword.identityStatus === "unavailable" ? newLabels.length > 0 : !keywordMap.has(keyword.baseKeyword)));
    let keywordMappings = {};
    if (absent.length) {
      if (reason === "rename" || reason.startsWith("auto")) { new Notice("关键词身份有变化，请手动扫描并确认身份对账；本次未写入"); return null; }
      keywordMappings = await this.confirmIdentityPreview("关键词身份对账", `扫描发现 ${absent.length} 个缺失/历史身份、${newLabels.length} 个新名称。只有明确选择才按改名处理；取消不写入。`, absent.map((old) => ({ key: old.id, label: `原关键词：${old.baseKeyword}`, choices: newLabels.map((label) => ({ value: label, label: `确认是同一关键词 → ${label}` })) })));
      if (!keywordMappings) return null;
      if (new Set(Object.values(keywordMappings)).size !== Object.values(keywordMappings).length) throw new Error("不能把多个关键词合并成同一个身份");
      for (const [id, label] of Object.entries(keywordMappings)) {
        oldKeywords[id].baseKeyword = label;
        oldKeywords[id].displayText = getDisplayText(label);
        oldKeywords[id].identityStatus = "active";
      }
    }
    const keywords = this.scanner.buildScannedKeywords(keywordMap, oldKeywords, raw.identityRegistry.nodes.map((record) => record.keywordId));
    const descriptors = this.identityDescriptors(keywords);
    let registry = identity.copy(raw.identityRegistry);
    // Explicit base rename also reattaches its capsule and unchanged drawer descriptors.
    const mappings = {};
    for (const record of registry.nodes) {
      if (!Object.prototype.hasOwnProperty.call(keywordMappings, record.keywordId)) continue;
      const match = descriptors.find((d) => identity.descriptorKey(d) === identity.descriptorKey(record));
      if (match && record.status === "unavailable") mappings[record.nodeKey] = identity.descriptorKey(match);
    }
    const delta = identity.preview(registry, descriptors);
    const missingDrawers = registry.nodes.filter((record) => record.kind === "drawer" && (record.status === "unavailable" ? delta.additions.some((d) => d.kind === "drawer" && d.keywordId === record.keywordId && d.type === record.type && d.scope === record.scope) : delta.missing.some((item) => item.nodeKey === record.nodeKey)) && !mappings[record.nodeKey]);
    if (missingDrawers.length) {
      if (reason === "rename" || reason.startsWith("auto")) { new Notice("抽屉路径有变化，请手动扫描并确认身份对账；本次未写入"); return null; }
      const selected = await this.confirmIdentityPreview("抽屉身份对账", "逐项确认旧抽屉与新路径是否为同一身份。父抽屉、子抽屉和根笔记分别列出；不猜测合并或拆分。", missingDrawers.map((old) => ({ key: old.nodeKey, label: `${raw.keywords[old.keywordId]?.baseKeyword || old.keywordId} / ${old.pathParts.join(" / ")} (${old.type}, ${old.scope})`, choices: delta.additions.filter((d) => d.kind === "drawer" && d.keywordId === old.keywordId && d.type === old.type && d.scope === old.scope).map((d) => ({ value: identity.descriptorKey(d), label: `确认同一身份 → ${d.pathParts.join(" / ")} (${d.scope})` })) })));
      if (!selected) return null;
      Object.assign(mappings, selected);
    }
    registry = identity.reconcile(registry, descriptors, mappings, this.repository.indexPath);
    return { keywords, registry };
  }

  async publishIdentityChange(reason) {
    // Owner commit is durable. A failed projection can always be retried from it.
    try {
      const published = await this.registerEvaIntegration(reason);
      if (!published) throw new Error("EVA 不可用");
      return true;
    } catch (error) {
      console.warn("[KeywordIndex][identity.publish-pending]", { reason, error: error.message });
      new Notice("关键词已保存，EVA 刷新待重试。请运行“重试永久身份关系刷新”；不要重复改名。");
      return false;
    }
  }

  getKeywordPathLabel(keyword) {
    const labels = [];
    let current = keyword;
    const keywords = this.repository.index.keywords || {};
    const seen = new Set();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      labels.unshift(text(current.displayText, current.baseKeyword));
      current = current.parentId ? keywords[current.parentId] : null;
    }
    return labels.join(" / ");
  }

  buildEvaRecord(nodeKey, keyword, label, pathLabel, kind, extra = {}) {
    const metaFields = [
      { label: "关键词", value: text(keyword.displayText, keyword.baseKeyword) },
      { label: "类型", value: text(extra.type, keyword.type) },
      { label: "节点", value: kind },
    ];
    if (extra.pathParts?.length) metaFields.push({ label: "抽屉路径", value: extra.pathParts.join(" / ") });
    if (extra.count != null) metaFields.push({ label: "笔记数", value: String(extra.count) });
    return {
      nodeKey,
      label,
      pathLabel,
      searchText: [label, pathLabel, KEYWORD_EVA_VIEW_LABEL, kind, text(keyword.baseKeyword), ...(extra.pathParts || [])].join(" "),
      metaFields,
      _sortKeywordPath: text(extra.keywordPath, pathLabel),
      _sortRank: Number.isFinite(Number(extra.sortRank)) ? Number(extra.sortRank) : 0,
      _sortCode: text(extra.sortCode),
      _sortPath: text(extra.sortPath, pathLabel),
    };
  }

  listEvaItems() {
    if (this.repository.lastError) throw new Error(this.repository.lastError);
    const registry = this.repository.index.identityRegistry;
    if (!registry) throw new Error("永久身份尚未升级；保留 EVA 旧索引");
    identity.validate(registry);
    const out = [];
    const keywords = this.repository?.listKeywords?.() || [];
    for (const keyword of keywords) {
      const keywordPath = this.getKeywordPathLabel(keyword);
      const capsuleKey = this.buildKeywordNodeKey(keyword.id);
      if (capsuleKey) out.push(this.buildEvaRecord(capsuleKey, keyword, `🏷️ ${text(keyword.displayText, keyword.baseKeyword)}`, keywordPath, "keyword", { count: (keyword.notes || []).length, keywordPath, sortRank: 0, sortPath: keywordPath }));
      const groupedNotes = { yaml: [], plus: [], dot: [] };
      (keyword.notes || []).forEach((note) => {
        const sourceType = text(note.sourceType, keyword.type);
        if (!groupedNotes[sourceType]) groupedNotes[sourceType] = [];
        groupedNotes[sourceType].push(note);
      });
      ["yaml", "plus", "dot"].forEach((type) => {
        const notes = groupedNotes[type] || [];
        if (notes.length === 0) return;
        this.collectEvaDrawerItems(out, keyword, notes, type, keywordPath);
      });
    }
    const emitted = new Set(out.map((item) => item.nodeKey));
    for (const record of registry.nodes) {
      if (emitted.has(record.nodeKey)) continue;
      const keyword = this.repository.index.keywords[record.keywordId];
      const label = record.kind === "keyword" ? text(keyword?.displayText, record.label || "历史关键词") : record.pathParts.join(" / ") || "根笔记";
      out.push({ nodeKey: record.nodeKey, label: `${record.status === "unavailable" ? "⚠ 暂不可用 · " : ""}${label}`, pathLabel: [keyword?.displayText, ...record.pathParts].filter(Boolean).join(" / "), metaFields: [{ label: "身份状态", value: record.status }] });
    }
    const dedupe = new Map();
    out.forEach((item) => {
      if (item?.nodeKey && !dedupe.has(item.nodeKey)) dedupe.set(item.nodeKey, item);
    });
    return Array.from(dedupe.values()).sort(compareEvaRecordOrder).map(stripEvaPrivateSortFields);
  }

  // Read-only scoped source tree. No repository load/save or EVA registration here.
  getDrawerProjection({ nodeKey, maxNodes = 1500 } = {}) {
    const index = this.repository?.index;
    const unavailable = (status) => ({ contractVersion: 1, status, complete: false, stableIdentity: false, rootNodeKey: nodeKey, nodes: [] });
    if (!index || this.repository.lastError) return unavailable("unavailable");
    const parsed = this.resolveIdentityNode(nodeKey);
    if (!parsed || parsed.identityRecord?.status === "unavailable") return unavailable("source-unavailable");
    const keyword = index.keywords?.[parsed.scopeId];
    if (!keyword || keyword.identityStatus === "unavailable") return unavailable("source-unavailable");
    const limit = Math.max(1, Math.min(5000, Number(maxNodes) || 1500));
    const revision = index.identityRegistry?.revision || 0;
    if (!this.drawerProjectionCache || this.drawerProjectionCache.index !== index || this.drawerProjectionCache.revision !== revision) {
      this.drawerProjectionCache = { index, revision, entries: new Map() };
    }
    const cacheKey = `${nodeKey}:${limit}`;
    const cached = this.drawerProjectionCache.entries.get(cacheKey);
    if (cached?.keyword === keyword && cached.notes === keyword.notes) return cached.snapshot;
    const drawer = parsed.scopeType === "keyword-drawer" ? (parsed.identityRecord || decodeKeywordDrawerItemId(parsed.itemId)) : null;
    const rootNodeKey = parsed.identityRecord?.nodeKey || nodeKey;
    const snapshot = { contractVersion: 1, status: "ready", complete: true,
      stableIdentity: Boolean(index.identityRegistry), rootNodeKey, revision, nodes: [] };
    if (drawer?.scope !== "root-notes") {
      const types = drawer ? [drawer.type] : ["yaml", "plus", "dot"];
      const visit = (node, pathParts, parentNodeKey, type, depth) => {
        if (snapshot.nodes.length >= limit || depth > 48) { snapshot.complete = false; return; }
        const sourceKey = this.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "branch");
        if (!sourceKey) { snapshot.complete = false; return; }
        snapshot.nodes.push(Object.freeze({ nodeKey: sourceKey, parentNodeKey,
          label: text(node.displayLabel, node.label), kind: node.kind === "subconcept" ? "subconcept" : parseBusSegment(node.label) ? "bus-drawer" : "drawer",
          type, pathParts: Object.freeze(pathParts.slice()), stableIdentity: snapshot.stableIdentity }));
        const children = [...Array.from(node.children.values()).sort(compareDrawerNode), ...Array.from(node.subconcepts?.values?.() || []).sort(compareDrawerNode)];
        for (const child of children) visit(child, [...pathParts, child.kind === "subconcept" ? getSubconceptRawPathPart(child) : child.label], sourceKey, type, depth + 1);
      };
      for (const type of types) {
        const tree = buildSuffixTree((keyword.notes || []).filter(note => text(note.sourceType, keyword.type) === type));
        const pathParts = drawer?.pathParts || [];
        const root = pathParts.length ? findSuffixTreeNodeByPath(tree, pathParts) : tree;
        if (!root) { snapshot.complete = false; continue; }
        const children = [...Array.from(root.children.values()).sort(compareDrawerNode), ...Array.from(root.subconcepts?.values?.() || []).sort(compareDrawerNode)];
        for (const child of children) visit(child, [...pathParts, child.kind === "subconcept" ? getSubconceptRawPathPart(child) : child.label], rootNodeKey, type, 1);
      }
    }
    Object.freeze(snapshot.nodes); Object.freeze(snapshot);
    if (this.drawerProjectionCache.entries.size >= 64) this.drawerProjectionCache.entries.delete(this.drawerProjectionCache.entries.keys().next().value);
    this.drawerProjectionCache.entries.set(cacheKey, { keyword, notes: keyword.notes, snapshot });
    return snapshot;
  }

  collectEvaDrawerItems(out, keyword, notes, type, keywordPath) {
    const tree = buildSuffixTree(notes);
    const visit = (node, pathParts) => {
      const hasChildDrawers = (node.children?.size || 0) > 0;
      const hasSubconcepts = (node.subconcepts?.size || 0) > 0;
      const hasDirectNotes = (node.notes || []).length > 0;
      const branchKey = this.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "branch");
      const isBus = Boolean(parseBusSegment(node.label));
      const isSubconcept = node.kind === "subconcept";
      const displayPath = getTreePathDisplayLabel(pathParts);
      out.push(this.buildEvaRecord(branchKey, keyword, `${isBus ? "🚌" : isSubconcept ? "◇" : "▸"} ${text(node.displayLabel, node.label)}`, `${keywordPath} / ${displayPath}`, isBus ? "bus-drawer" : isSubconcept ? "subconcept" : "drawer", { type, pathParts: getTreePathDisplayParts(pathParts), count: countTreeNotes(node), keywordPath, sortRank: 1, sortCode: node.sortCode, sortPath: `${keywordPath} / ${displayPath}` }));
      if (hasDirectNotes && (hasChildDrawers || hasSubconcepts)) {
        const rootKey = this.buildKeywordDrawerNodeKey(keyword.id, type, pathParts, "root-notes");
        out.push(this.buildEvaRecord(rootKey, keyword, "📝 根笔记", `${keywordPath} / ${displayPath} / 根笔记`, "root-notes", { type, pathParts: getTreePathDisplayParts(pathParts), count: node.notes.length, keywordPath, sortRank: 1, sortCode: getMinAtomSortCodeFromNotes(node.notes), sortPath: `${keywordPath} / ${displayPath} / 根笔记` }));
      }
      Array.from(node.children.values()).sort(compareDrawerNode).forEach((child) => visit(child, [...pathParts, child.label]));
      Array.from(node.subconcepts?.values?.() || []).sort(compareDrawerNode).forEach((child) => visit(child, [...pathParts, getSubconceptRawPathPart(child)]));
    };
    if ((tree.notes || []).length > 0 && ((tree.children?.size || 0) > 0 || (tree.subconcepts?.size || 0) > 0)) {
      const rootKey = this.buildKeywordDrawerNodeKey(keyword.id, type, [], "root-notes");
      out.push(this.buildEvaRecord(rootKey, keyword, "📝 根笔记", `${keywordPath} / 根笔记`, "root-notes", { type, pathParts: [], count: tree.notes.length, keywordPath, sortRank: 1, sortCode: getMinAtomSortCodeFromNotes(tree.notes), sortPath: `${keywordPath} / 根笔记` }));
    }
    Array.from(tree.children.values()).sort(compareDrawerNode).forEach((child) => visit(child, [child.label]));
    Array.from(tree.subconcepts?.values?.() || []).sort(compareDrawerNode).forEach((child) => visit(child, [getSubconceptRawPathPart(child)]));
  }

  async loadRawIndexForWrite() {
    const indexPath = this.repository.indexPath;
    const rawText = await this.app.vault.adapter.read(indexPath);
    const raw = JSON.parse(rawText || "{}");
    if (!raw || typeof raw !== "object" || !raw.keywords || typeof raw.keywords !== "object") {
      throw new Error("索引 JSON 结构无效：缺少 keywords");
    }
    return { indexPath, rawText, raw };
  }

  buildUiStateMapsForIndex(raw) {
    return {
      capsuleExpanded: normalizeAnyBooleanMap(raw.capsuleExpanded || this.settings.uiState?.capsuleExpanded || {}),
      notesDrawerOpen: normalizeBooleanMap(raw.notesDrawerOpen || this.settings.uiState?.notesDrawerOpen || {}),
      drawerExpanded: this.normalizeDrawerExpandedMap(raw.drawerExpanded || this.settings.uiState?.drawerExpanded || {}),
    };
  }

  migrateUiStateKeyPrefix(map, oldId, newId) {
    const out = {};
    Object.entries(map || {}).forEach(([key, value]) => {
      const nextKey = String(key).startsWith(`${oldId}::`) ? String(key).replace(`${oldId}::`, `${newId}::`) : key;
      out[nextKey] = value;
    });
    return out;
  }

  validateKeywordIndex(raw) {
    if (Object.prototype.hasOwnProperty.call(raw, "identityRegistry")) identity.validate(raw.identityRegistry);
    identity.keywordIdsByLabel(raw.keywords || {});
    const keywords = raw?.keywords || {};
    const ids = new Set(Object.keys(keywords));
    Object.entries(keywords).forEach(([id, keyword]) => {
      if (!keyword || typeof keyword !== "object") throw new Error(`关键词结构无效：${id}`);
      if (keyword.parentId && !ids.has(keyword.parentId)) throw new Error(`父级不存在：${id} -> ${keyword.parentId}`);
      const seen = new Set();
      let current = keyword;
      while (current?.parentId) {
        if (seen.has(current.parentId)) throw new Error(`检测到父级循环：${id}`);
        seen.add(current.parentId);
        current = keywords[current.parentId];
      }
      if (!Array.isArray(keyword.notes)) throw new Error(`notes 不是数组：${id}`);
    });
  }

  async safeWriteKeywordIndex(indexPath, raw, txId, expectedText, sourceGuard) {
    if (typeof expectedText !== "string") throw new Error("缺少写入前索引快照");
    return this.commitIdentityTransaction(indexPath, raw, expectedText, [], txId, sourceGuard);
  }

  async writeTxManifest(indexPath, txId, manifest) {
    const manifestPath = `${indexPath}.tx-${txId}.json`;
    await this.app.vault.adapter.write(manifestPath, JSON.stringify(manifest, null, 2));
    return manifestPath;
  }

  async backupNoteFile(file, txId) {
    const content = await this.app.vault.read(file);
    const backupPath = `${file.path}.bak-${timestampForFileName()}-${txId}`;
    await this.app.vault.adapter.write(backupPath, content);
    return { backupPath, content };
  }

  buildKeywordNoteSyncPlan(oldKeyword, newKeyword, notes, type) {
    const plan = [];
    if (oldKeyword === newKeyword) return plan;
    for (const note of notes || []) {
      if (type === "yaml") {
        plan.push({ type: "yaml", note, path: note.path });
      } else if (type === "plus" || type === "dot") {
        const delimiter = type === "plus" ? "++" : "··";
        const oldFull = note.suffix ? oldKeyword + note.suffix : oldKeyword;
        const newFull = note.suffix ? newKeyword + note.suffix : newKeyword;
        const oldPattern = `${delimiter}${oldFull}${delimiter}`;
        const newPattern = `${delimiter}${newFull}${delimiter}`;
        if (note.name.includes(oldPattern)) {
          const newName = note.name.replace(oldPattern, newPattern);
          const newPath = joinVaultPath(dirname(note.path), newName);
          if (hasIllegalFileNameChars(newName.replace(/\.md$/i, ""))) throw new Error(`重命名目标包含非法字符：${newName}`);
          plan.push({ type, note, path: note.path, newPath, newName, caseOnly: newPath.toLowerCase() === note.path.toLowerCase() && newPath !== note.path });
        }
      }
    }
    return plan;
  }

  async preflightNoteSyncPlan(plan) {
    const targets = new Set();
    for (const item of plan) {
      const file = this.app.vault.getAbstractFileByPath(item.path);
      if (!(file instanceof TFile)) throw new Error(`待同步笔记不存在：${item.path}`);
      if (item.newPath) {
        const key = item.newPath.toLowerCase();
        if (targets.has(key)) throw new Error(`重命名目标重复：${item.newPath}`);
        targets.add(key);
        if (item.caseOnly) {
          throw new Error(`仅大小写变化的重命名跨平台不稳定，请先手动改成临时名称：${item.path} -> ${item.newPath}`);
        }
        if (await this.app.vault.adapter.exists(item.newPath)) {
          throw new Error(`重命名目标已存在：${item.newPath}`);
        }
      }
    }
  }

  async rollbackNoteSync(applied) {
    for (const item of [...applied].reverse()) {
      try {
        if (item.type === "rename" && item.newPath && item.oldPath) {
          const renamed = this.app.vault.getAbstractFileByPath(item.newPath);
          const occupied = this.app.vault.getAbstractFileByPath(item.oldPath);
          if (occupied instanceof TFile && item.oldPath !== item.newPath) {
            console.error("[KeywordIndex][keyword-edit.rollback-blocked]", { reason: "old-path-occupied", item });
            continue;
          }
          if (renamed instanceof TFile) await this.app.fileManager.renameFile(renamed, item.oldPath);
        }
        if (item.backupPath && item.oldPath) {
          const backupText = await this.app.vault.adapter.read(item.backupPath);
          const file = this.app.vault.getAbstractFileByPath(item.oldPath);
          if (file instanceof TFile) await this.app.vault.modify(file, backupText);
        }
      } catch (error) {
        console.error("[KeywordIndex][keyword-edit.rollback-failed]", { item, error });
      }
    }
  }

  async syncKeywordToNotes(oldKeyword, newKeyword, notes, type, txId) {
    if (oldKeyword === newKeyword) return { updated: 0, failed: 0, noteUpdates: {} };
    const plan = this.buildKeywordNoteSyncPlan(oldKeyword, newKeyword, notes, type);
    await this.preflightNoteSyncPlan(plan);
    let updated = 0;
    let failed = 0;
    const noteUpdates = {};
    const applied = [];
    for (const step of plan) {
      const note = step.note;
      try {
        const file = this.app.vault.getAbstractFileByPath(note.path);
        if (!(file instanceof TFile)) continue;
        const backup = await this.backupNoteFile(file, txId);
        applied.push({ type: "content", oldPath: note.path, backupPath: backup.backupPath });
        let content = backup.content;
        let modified = false;
        if (type === "yaml") {
          const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n)?/);
          if (yamlMatch) {
            const yamlContent = yamlMatch[1];
            const oldFull = note.suffix ? oldKeyword + note.suffix : oldKeyword;
            const newFull = note.suffix ? newKeyword + note.suffix : newKeyword;
            const values = extractKeywordValuesFromYamlBody(yamlContent);
            let matched = false;
            const nextValues = values.map((value) => {
              if (value !== oldFull) return value;
              matched = true;
              return newFull;
            });
            if (matched) {
              const nextYaml = replaceOrAppendKeywordYamlField(yamlContent, nextValues);
              const suffix = content.slice(yamlMatch[0].length);
              content = `---\n${nextYaml}\n---\n${suffix}`;
              modified = content !== backup.content;
            } else {
              const nextYaml = yamlContent.replace(new RegExp(`(关键词管理:[\\s\\S]*?)${escapeRegex(oldFull)}`, "g"), `$1${newFull}`);
              if (nextYaml !== yamlContent) {
                const suffix = content.slice(yamlMatch[0].length);
                content = `---\n${nextYaml}\n---\n${suffix}`;
                matched = true;
                modified = content !== backup.content;
              }
            }
            if (!matched) {
              console.warn("[KeywordIndex][keyword-edit.yaml-keyword-missing]", { txId, path: note.path, oldFull, newFull, values });
            }
            if (modified) {
              console.info("[KeywordIndex][keyword-edit.yaml-updated]", { txId, path: note.path, oldFull, newFull });
            }
          } else {
            console.warn("[KeywordIndex][keyword-edit.yaml-frontmatter-missing]", { txId, path: note.path });
          }
          if (modified) {
            await this.app.vault.modify(file, content);
          }
        }
        if ((type === "plus" || type === "dot") && step.newPath) {
            await this.app.fileManager.renameFile(file, step.newPath);
            applied.push({ type: "rename", oldPath: note.path, newPath: step.newPath, backupPath: backup.backupPath });
            noteUpdates[note.path] = { path: step.newPath, name: step.newName, backupPath: backup.backupPath };
            modified = true;
        }
        if (modified) updated += 1;
      } catch (error) {
        console.error("[KeywordIndex][keyword-edit.note-sync-failed]", { path: note.path, error });
        failed += 1;
      }
    }
    return { updated, failed, noteUpdates, applied, plan };
  }

  async mountKeywordToNoteYaml(notePath, keywordRaw) {
    return this.withIdentityMutation(async () => {
      const keywordText = text(keywordRaw);
      if (!keywordText) throw new Error("关键词不能为空");
      const { indexPath, raw, rawText } = await this.loadRawIndexForWrite();
      this.requireIdentityRegistry(raw);
      const file = this.app.vault.getAbstractFileByPath(notePath);
      if (!(file instanceof TFile)) throw new Error("未找到笔记：" + notePath);
      const before = await this.app.vault.read(file);
      const match = before.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n)?/);
      const values = match ? readIdentityYamlValues(match[1]) : [];
      if (values.includes(keywordText)) return { changed: false, wasAdded: false };
      const yaml = replaceIdentityYamlValues(match?.[1] || "", [...values, keywordText]);
      const after = "---\n" + yaml + "\n---\n" + (match ? before.slice(match[0].length) : before);
      raw.identityRegistry.revision += 1;
      await this.commitIdentityTransaction(indexPath, raw, rawText, [{ path: notePath, before, after }], identity.allocate("kwmount-", new Set()));
      return { changed: true, wasAdded: true };
    });
  }

  migrateDrawerExpandedForDrawerRename(drawerExpanded, keywordId, type, oldPathParts, newPathParts) {
    const source = this.normalizeDrawerExpandedMap(drawerExpanded || {});
    const next = {};
    Object.entries(source).forEach(([key, expanded]) => {
      const [safeKeywordId, safeType, scope, ...rest] = String(key || "").split("::");
      if (!safeKeywordId || !safeType || !scope) {
        next[key] = expanded;
        return;
      }
      if (safeKeywordId !== text(keywordId) || safeType !== text(type, "mixed")) {
        next[key] = expanded;
        return;
      }
      const pathText = rest.join("::");
      const pathParts = pathText === "__root__" ? [] : pathText.split(">").filter(Boolean);
      if (pathParts.length === 0 || !startsWithPathParts(pathParts, oldPathParts)) {
        next[key] = expanded;
        return;
      }
      const migratedParts = [...newPathParts, ...pathParts.slice(oldPathParts.length)];
      const migratedKey = buildDrawerStateKey(keywordId, type, migratedParts, scope);
      next[migratedKey] = expanded;
    });
    return this.normalizeDrawerExpandedMap(next);
  }

  async renameKeywordDrawerSegment({ keywordId, oldPathParts, newLabel, newPathParts }) {
    return this.withIdentityMutation(async () => {
      const { indexPath, raw, rawText } = await this.loadRawIndexForWrite();
      this.requireIdentityRegistry(raw);
      const keyword = raw.keywords[keywordId];
      if (!keyword || keyword.identityStatus === "unavailable") throw new Error("关键词身份暂不可用");
      const preview = buildDrawerRenamePreview(keyword, oldPathParts, newLabel || newPathParts?.at(-1));
      if (!preview.ok) throw new Error(preview.error);
      const target = newPathParts || preview.newPathParts;
      if (!Array.isArray(target) || target.some((part) => !text(part) || /[+\r\n]/.test(part))) throw new Error("新路径包含非法片段");
      const nextRegistry = identity.moveSubtree(raw.identityRegistry, keywordId, "yaml", preview.oldPathParts, target);
      const replacements = new Map();
      const nextNotes = (keyword.notes || []).map((note) => {
        const parts = splitSuffixParts(note.suffix);
        if (text(note.sourceType, keyword.type) !== "yaml" || !startsWithPathParts(parts, preview.oldPathParts)) return note;
        const nextParts = [...target, ...parts.slice(preview.oldPathParts.length)];
        if (!replacements.has(note.path)) replacements.set(note.path, []);
        replacements.get(note.path).push({ oldFull: buildKeywordPathText(keyword.baseKeyword, parts), newFull: buildKeywordPathText(keyword.baseKeyword, nextParts) });
        return { ...note, suffix: buildSuffixFromParts(nextParts) };
      });
      if (!replacements.size) throw new Error("当前路径没有可改名的 YAML 笔记");
      const plans = await this.buildIdentityYamlPlans(replacements);
      keyword.notes = nextNotes;
      keyword.sortKey = computeSortKey(nextNotes);
      raw.identityRegistry = identity.reconcile(nextRegistry, this.identityDescriptors(raw.keywords), {}, indexPath);
      const uiState = this.buildUiStateMapsForIndex(raw);
      raw.drawerExpanded = this.migrateDrawerExpandedForDrawerRename(uiState.drawerExpanded, keywordId, "yaml", preview.oldPathParts, target);
      const txId = identity.allocate("kwdrawer-", new Set());
      const result = await this.commitIdentityTransaction(indexPath, raw, rawText, plans, txId);
      return { ...result, keywordId, oldPathText: preview.oldPathText, newPathText: target.join(" + "), notesTouched: plans.length };
    });
  }

  async saveKeywordEditToIndex({ oldId, newLabel, selectedParentId }) {
    return this.withIdentityMutation(async () => {
      const { indexPath, raw, rawText } = await this.loadRawIndexForWrite();
      this.requireIdentityRegistry(raw);
      const keywords = raw.keywords;
      const keyword = keywords[oldId];
      if (!keyword || keyword.identityStatus === "unavailable") throw new Error("关键词身份暂不可用");
      const label = text(newLabel);
      if (!label || /[+\r\n]/.test(label)) throw new Error("关键词名称为空或包含路径分隔符");
      if (Object.values(keywords).some((item) => item.id !== oldId && item.identityStatus !== "unavailable" && item.baseKeyword === label)) throw new Error("已有同名关键词，不能通过改名合并");
      if (selectedParentId && (!keywords[selectedParentId] || keywords[selectedParentId].identityStatus === "unavailable" || selectedParentId === oldId || this.getDescendantIds(oldId, keywords).includes(selectedParentId))) throw new Error("父级无效或形成循环");
      const oldLabel = keyword.baseKeyword;
      const replacements = new Map(), renamePlans = new Map();
      if (oldLabel !== label) {
        for (const note of keyword.notes || []) {
          const type = text(note.sourceType, keyword.type);
          if (type === "yaml") {
            if (!replacements.has(note.path)) replacements.set(note.path, []);
            replacements.get(note.path).push({ oldFull: oldLabel + text(note.suffix), newFull: label + text(note.suffix) });
          } else if (type === "plus" || type === "dot") {
            const delimiter = type === "plus" ? "++" : "··";
            const oldPart = delimiter + oldLabel + text(note.suffix) + delimiter;
            const newPart = delimiter + label + text(note.suffix) + delimiter;
            const file = this.app.vault.getAbstractFileByPath(note.path);
            if (!(file instanceof TFile)) throw new Error("改名来源笔记不存在");
            const plan = renamePlans.get(note.path) || { path: note.path, before: await this.app.vault.read(file), newPath: note.path };
            if (!plan.newPath.includes(oldPart)) throw new Error("文件名已变化，请重新扫描");
            plan.newPath = plan.newPath.replace(oldPart, newPart);
            plan.after = plan.before;
            renamePlans.set(note.path, plan);
          } else throw new Error("未知笔记来源，停止改名");
        }
      }
      if ([...renamePlans.keys()].some((key) => replacements.has(key))) throw new Error("同一文件同时含 YAML 和文件名关键词，请先分别整理来源");
      for (const plan of renamePlans.values()) {
        const name = plan.newPath.slice(plan.newPath.lastIndexOf("/") + 1);
        if (hasIllegalFileNameChars(name) || plan.path.toLowerCase() === plan.newPath.toLowerCase()) throw new Error("文件名改名目标无效");
      }
      const plans = [...await this.buildIdentityYamlPlans(replacements), ...renamePlans.values()];
      keyword.id = oldId; // Permanently frozen: never hash the new label.
      keyword.baseKeyword = label;
      keyword.displayText = getDisplayText(label);
      keyword.sortLetter = getSortLetter(label);
      keyword.parentId = selectedParentId || "";
      // A filename rename changes note references in every keyword, not just this capsule.
      for (const item of Object.values(keywords)) {
        item.notes = (item.notes || []).map((note) => {
          const plan = renamePlans.get(note.path);
          return plan ? { ...note, path: plan.newPath, name: plan.newPath.slice(plan.newPath.lastIndexOf("/") + 1) } : note;
        });
      }
      raw.identityRegistry.revision += 1;
      const txId = identity.allocate("kwedit-", new Set());
      const result = await this.commitIdentityTransaction(indexPath, raw, rawText, plans, txId);
      return { ...result, oldId, newId: oldId, notesTouched: plans.length };
    });
  }

  async buildIdentityYamlPlans(replacements) {
    const plans = [];
    for (const [notePath, valuesToReplace] of replacements) {
      const file = this.app.vault.getAbstractFileByPath(notePath);
      if (!(file instanceof TFile)) throw new Error("待更新笔记不存在：" + notePath);
      const before = await this.app.vault.read(file);
      const match = before.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n)?/);
      if (!match) throw new Error("未找到 frontmatter：" + notePath);
      const values = readIdentityYamlValues(match[1]);
      const replacementMap = new Map(valuesToReplace.map((item) => [item.oldFull, item.newFull]));
      for (const oldFull of replacementMap.keys()) if (!values.includes(oldFull)) throw new Error("来源关键词已变化，请重新扫描：" + notePath);
      const nextValues = values.map((value) => replacementMap.has(value) ? replacementMap.get(value) : value);
      if (new Set(nextValues).size < new Set(values).size) throw new Error("改名会合并同一笔记中的路径，已停止");
      const after = "---\n" + replaceIdentityYamlValues(match[1], nextValues) + "\n---\n" + before.slice(match[0].length);
      plans.push({ path: notePath, before, after });
    }
    return plans;
  }

  identityTransactionIO(indexPath) {
    const journalPath = indexPath + ".identity-pending.json";
    const adapter = this.app.vault.adapter;
    return {
      exists: (path) => adapter.exists(path),
      readIndex: (path) => adapter.read(path),
      readNote: async (path) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error("笔记不存在：" + path);
        return this.app.vault.read(file);
      },
      replaceNote: async (path, before, after) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile) || typeof this.app.vault.process !== "function") throw new Error("笔记原子更新 API 不可用");
        await this.app.vault.process(file, (current) => {
          if (current !== before) throw new Error("笔记并发修改：" + path);
          return after;
        });
      },
      renameNote: async (oldPath, newPath, before) => {
        const file = this.app.vault.getAbstractFileByPath(oldPath);
        if (!(file instanceof TFile) || await this.app.vault.read(file) !== before || await adapter.exists(newPath)) throw new Error("笔记移动冲突：" + oldPath);
        await this.app.fileManager.renameFile(file, newPath);
      },
      writeJournal: async (journal) => {
        if (await adapter.exists(journalPath)) throw new Error("已有未完成身份事务，请先恢复");
        const contents = JSON.stringify(journal, null, 2);
        await adapter.write(journalPath, contents);
        if (await adapter.read(journalPath) !== contents) throw new Error("身份事务日志回读不一致");
      },
      finishJournal: async (journal) => {
        const archive = indexPath + ".tx-" + journal.txId + ".json";
        const contents = JSON.stringify(journal, null, 2);
        await adapter.write(archive, contents);
        if (await adapter.read(archive) !== contents) throw new Error("事务归档回读不一致");
        await adapter.remove(journalPath);
      },
      writeIndex: async (path, contents) => {
        await adapter.write(path, contents);
      },
    };
  }

  async commitIdentityTransaction(indexPath, raw, rawText, plans, txId, sourceGuard) {
    this.validateKeywordIndex(raw);
    const previous = JSON.parse(rawText);
    if (previous.identityRegistry) identity.validate(previous.identityRegistry);
    const retainedKeys = new Map(raw.identityRegistry.nodes.map((record) => [record.id, record.nodeKey]));
    for (const record of previous.identityRegistry?.nodes || []) {
      if (retainedKeys.get(record.id) !== record.nodeKey) throw new Error("旧永久身份被替换，拒绝提交");
    }
    const after = JSON.stringify(raw, null, 2);
    const io = this.identityTransactionIO(indexPath);
    if (sourceGuard) {
      // Scan-only proof travels across async backup/journal/CAS, right up to owner write.
      // Other identity transactions (including note edits and recovery) retain their IO.
      const writeIndex = io.writeIndex, writeJournal = io.writeJournal;
      io.writeIndex = (path, contents) => { sourceGuard(); return writeIndex(path, contents); };
      io.writeJournal = (journal) => { sourceGuard(); return writeJournal(journal); };
    }
    const backupPath = indexPath + ".bak-" + txId;
    await this.app.vault.adapter.write(backupPath, rawText);
    if (await this.app.vault.adapter.read(backupPath) !== rawText) throw new Error("备份回读失败");
    const result = await identityTransaction.execute(io, { indexPath, before: rawText, after, plans, txId });
    let manifestWarning = result.warning || "";
    await this.repository.load();
    const published = await this.publishIdentityChange(txId);
    if (!published) manifestWarning = "关键词已保存，EVA 刷新待重试";
    try {
      await io.finishJournal({ schema: 1, txId, indexPath, before: rawText, after, plans, phase: "committed", published });
    } catch (error) {
      manifestWarning += "；事务已提交，但日志归档未完成，请运行身份事务恢复";
    }
    console.info("[KeywordIndex][identity.summary]", { txId, status: manifestWarning ? "WARN" : "PASS", indexPath, notesTouched: plans.length, published });
    return { backupPath, manifestPath: indexPath + ".tx-" + txId + ".json", manifestWarning, published };
  }

  async recoverIdentityTransaction() {
    return this.withIdentityMutation(async () => {
      const indexPath = this.repository.indexPath;
      const journalPath = indexPath + ".identity-pending.json";
      if (!await this.app.vault.adapter.exists(journalPath)) { new Notice("没有未完成身份事务"); return; }
      const journal = JSON.parse(await this.app.vault.adapter.read(journalPath));
      if (journal.indexPath !== indexPath) throw new Error("事务所属索引不匹配");
      const accepted = await this.confirmIdentityPreview("恢复身份事务", "已提交的事务只重试关系刷新；未提交的事务仅在笔记仍等于本事务写入内容时回滚。存在冲突则停止，不覆盖后续修改。");
      if (!accepted) return;
      const io = this.identityTransactionIO(indexPath);
      const result = await identityTransaction.recover(io, journal);
      await this.repository.load();
      if (result.committed) await this.publishIdentityChange("recovery");
      await io.finishJournal({ ...journal, phase: result.committed ? "committed" : "rolled-back" });
      await this.refreshViews();
    }, { recovery: true });
  }

  persistUiStateFromView(view) {
    const keywords = this.repository?.listKeywords?.() || [];
    const capsuleExpanded = {};
    const notesDrawerOpen = {};
    keywords.forEach((keyword) => {
      capsuleExpanded[keyword.id] = !view.collapsedIds.has(keyword.id);
      notesDrawerOpen[keyword.id] = view.notesOpenIds.has(keyword.id);
    });
    this.settings.uiState = {
      capsuleExpanded,
      notesDrawerOpen,
      drawerExpanded: this.normalizeDrawerExpandedMap(view.drawerExpanded),
      keywordViewMode: normalizeKeywordViewMode(view.preferredKeywordViewMode || this.settings.uiState?.keywordViewMode),
    };
    window.clearTimeout(this._uiStateSaveTimer);
    this._uiStateSaveTimer = window.setTimeout(() => {
      this.saveSettings().catch((error) => console.error("[KeywordIndex][ui-state.save-failed]", error));
    }, 250);
  }

  async activateView({ deferRender = false } = {}) {
    if (this.unloaded) return null;
    if (this.activatingKeywordView) {
      const leaf = await this.activatingKeywordView;
      if (!this.unloaded) await this.app.workspace.revealLeaf(leaf);
      return leaf;
    }
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_KEYWORD_INDEX)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf('tab');
      this.deferredRevealLeaves ||= new WeakSet();
      if (deferRender) this.deferredRevealLeaves.add(leaf);
      const createdLeaf = leaf;
      const creating = (async () => {
        try { await createdLeaf.setViewState({ type: VIEW_TYPE_KEYWORD_INDEX, active: true }); return createdLeaf; }
        finally { this.deferredRevealLeaves.delete(createdLeaf); }
      })();
      this.activatingKeywordView = creating;
      try { await creating; } finally { if (this.activatingKeywordView === creating) this.activatingKeywordView = null; }
    }
    if (!this.unloaded) await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  async openEvaNode(nodeKey) {
    return this.revealKeywordTarget({ nodeKey: text(nodeKey), openNotes: true });
  }

  async revealKeywordTarget(request) {
    const generation = this.navigationGeneration = (this.navigationGeneration || 0) + 1;
    const isCurrent = () => !this.unloaded && generation === this.navigationGeneration;
    await this.repository.load({ reuseUnchanged: true });
    if (!isCurrent()) return false;
    const resolve = () => {
      if (request.nodeKey && this.repository.lastError) return null;
      const parsed = request.nodeKey ? this.resolveIdentityNode(request.nodeKey) : null;
      const keyword = this.repository.index.keywords?.[parsed?.scopeId || request.keywordId];
      if (!keyword || keyword.identityStatus === 'unavailable' || (request.nodeKey && !parsed)) return null;
      return { parsed, keyword };
    };
    if (!resolve()) { new Notice('该关键词身份暂不可用，请先进行身份对账'); return false; }
    let view;
    try {
      const leaf = await this.activateView({ deferRender: true });
      view = leaf?.view;
      if (!isCurrent() || !(view instanceof KeywordIndexView) || view.closed) return false;
      const current = resolve();
      if (!current) return false;
      const { keyword, parsed } = current;
      view.query = '';
      view.useFullModeForExternalReveal('external-reveal');
      let parent = text(keyword.parentId);
      const visited = new Set();
      while (parent && !visited.has(parent) && this.repository.index.keywords[parent]) {
        visited.add(parent); view.collapsedIds.delete(parent);
        parent = text(this.repository.index.keywords[parent].parentId);
      }
      view.collapsedIds.delete(keyword.id);
      if (request.openNotes) view.notesOpenIds.add(keyword.id);
      if (parsed?.scopeType === 'keyword-drawer') {
        const target = parsed.identityRecord || decodeKeywordDrawerItemId(parsed.itemId);
        for (let n = 1; n <= target.pathParts.length; n += 1) view.drawerExpanded[buildDrawerStateKey(keyword.id, target.type, target.pathParts.slice(0, n), 'branch')] = true;
        view.drawerExpanded[buildDrawerStateKey(keyword.id, target.type, target.pathParts, target.scope)] = true;
      }
      const reusable = view.renderedIndex === this.repository.index && view.renderedSignature === view.displaySignature()
        && view.renderedScanPreview === view.scanPreview && view.renderedComments === this.settings.keywordComments;
      if (!reusable || !view.findRevealTarget(request.nodeKey, request.nodeKey ? '' : keyword.id)) view.render();
      await new Promise((resolvePaint) => {
        let finished = false, frame = null;
        const finish = () => { if (finished) return; finished = true; window.clearTimeout(timer); if (frame != null) window.cancelAnimationFrame(frame); resolvePaint(); };
        const timer = window.setTimeout(finish, 80);
        frame = window.requestAnimationFrame(finish);
      });
      if (!isCurrent() || view.closed || !view.contentEl.isConnected || view.renderedIndex !== this.repository.index) return false;
      return request.nodeKey ? view.revealEvaNode(request.nodeKey, 'auto') : view.revealKeywordPrimaryAnchor(keyword.id, 'auto');
    } finally {
      // A cancelled initial navigation must not leave the newly created view blank.
      if (view instanceof KeywordIndexView && !view.closed && !this.unloaded && !view.renderedIndex) view.render();
    }
  }

  async refreshViews() {
    const pendingBusRefresh = this.busViewRefreshPending;
    this.busViewRefreshPending = false;
    try {
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_KEYWORD_INDEX)) {
        await leaf.view?.refresh?.();
      }
    } catch (error) {
      if (pendingBusRefresh) this.busViewRefreshPending = true;
      throw error;
    }
  }

  findFileByCode(code) {
    const targetCode = text(code);
    if (!targetCode) return null;
    return this.app.vault.getMarkdownFiles().find((file) => parseNoteNameParts(file.basename).code === targetCode) || null;
  }

  generateMethodACode(currentCode) {
    let nextCode = incrementCode(currentCode);
    if (nextCode && !this.findFileByCode(nextCode)) return nextCode;
    nextCode = text(currentCode);
    let attempts = 0;
    do {
      nextCode = extendCode(nextCode);
      attempts += 1;
    } while (this.findFileByCode(nextCode) && attempts < 8);
    return nextCode;
  }

  getParentCode(code) {
    const cleanCode = text(code);
    const lastDotIndex = cleanCode.lastIndexOf(".");
    return lastDotIndex < 0 ? "" : cleanCode.slice(0, lastDotIndex);
  }

  buildParentLink(code) {
    const parentCode = this.getParentCode(code);
    if (!parentCode) return "";
    const parentFile = this.findFileByCode(parentCode);
    return parentFile ? `[[${parentFile.basename}]]` : "";
  }

  extractInlineFields(content) {
    return String(content || "")
      .split(/\r?\n/)
      .map((line) => text(line))
      .filter((line) => /^[\w\u4e00-\u9fa5]+::\s*.+/.test(line));
  }

  findBusScopeForKeywordPrefix(keywordId, prefixParts = [], keywords = this.repository.index.keywords) {
    const keyword = keywords?.[keywordId];
    if (!keyword) return null;
    const cleanPrefix = (prefixParts || []).map((part) => text(part)).filter(Boolean);
    const candidates = [];
    for (const note of keyword.notes || []) {
      if (text(note.sourceType, keyword.type) !== "yaml") continue;
      const parts = splitSuffixParts(note.suffix);
      if (parts.length <= cleanPrefix.length) continue;
      const matchesPrefix = cleanPrefix.every((part, index) => parts[index] === part);
      if (!matchesPrefix) continue;
      const bus = parseBusSegment(parts[cleanPrefix.length]);
      if (!bus) continue;
      candidates.push({ note, parts, bus });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.bus.number - a.bus.number || text(b.note.path).localeCompare(text(a.note.path), "zh-CN", { numeric: true, sensitivity: "base" }));
    const latest = candidates[0];
    const latestParts = [...cleanPrefix, latest.bus.raw];
    const exactSuffix = buildSuffixFromParts(latestParts);
    const exactSource = candidates.find((candidate) => candidate.bus.number === latest.bus.number && text(candidate.note?.suffix) === exactSuffix)?.note || null;
    const baseKeyword = text(keyword.baseKeyword, keyword.displayText);
    return {
      keywordId,
      baseKeyword,
      prefixParts: cleanPrefix,
      latestBusPart: latest.bus.raw,
      latestBusNumber: latest.bus.number,
      latestBusWidth: latest.bus.width,
      latestKeywordText: buildKeywordPathText(baseKeyword, latestParts),
      scopeKeywordText: buildKeywordPathText(baseKeyword, cleanPrefix),
      latestSuffix: exactSuffix,
      latestDescendantNote: latest.note,
      sourceNote: exactSource,
    };
  }

  resolveBusScopeNodeNote(scope) {
    if (!scope) return null;
    const sourcePath = text(scope.sourceNote?.path);
    if (sourcePath) {
      const file = this.app.vault.getAbstractFileByPath(sourcePath);
      if (file instanceof TFile) return file;
    }
    const keyword = this.repository.index.keywords?.[scope.keywordId];
    const exact = (keyword?.notes || []).find((note) => text(note.suffix) === text(scope.latestSuffix) && text(note.sourceType, keyword.type) === "yaml");
    if (exact?.path) {
      const file = this.app.vault.getAbstractFileByPath(exact.path);
      if (file instanceof TFile) return file;
    }
    return null;
  }

  previewBusNextNote(scope, noteTitle, nextBusPart) {
    try {
      if (!scope) return { error: "未定位到 BUS 系列" };
      const sourceFile = this.resolveBusScopeNodeNote(scope);
      if (!(sourceFile instanceof TFile)) return { error: `未找到当前 BUS 层级节点笔记：${scope.latestKeywordText || scope.latestSuffix || "未知作用域"}` };
      const sourceParts = parseNoteNameParts(sourceFile.basename);
      if (!sourceParts.code) return { sourceFile, error: `无法解析末端笔记编号：${sourceFile.basename}` };
      const newCode = this.generateMethodACode(sourceParts.code);
      if (!newCode || newCode === sourceParts.code) return { sourceFile, error: `无法生成新编号：${sourceParts.code}` };
      const safeNoteTitle = text(noteTitle);
      const cleanBusPart = text(nextBusPart);
      const nextKeywordText = buildKeywordPathText(scope.baseKeyword, [...scope.prefixParts, cleanBusPart]);
      const newFileName = `${newCode}- ${safeNoteTitle || "<等待输入标题>"}`;
      const folderPath = sourceFile.parent?.path || "";
      const newFilePath = folderPath ? `${folderPath}/${newFileName}.md` : `${newFileName}.md`;
      return { sourceFile, newCode, newFileName, newFilePath, nextKeywordText };
    } catch (error) {
      return { error: error.message };
    }
  }

  handleEvaChangedRefresh() {
    if (this.unloaded) return Promise.resolve(false);
    if (this.busViewRefreshBatch) {
      this.busViewRefreshBatch.pending = true;
      return Promise.resolve(false);
    }
    return this.refreshViews();
  }

  async flushBusViewRefreshes(force = false) {
    const batch = this.busViewRefreshBatch;
    let needed = force || batch?.pending;
    while (needed && !this.unloaded) {
      if (batch) batch.pending = false;
      try { await this.refreshViews(); }
      catch (error) { if (batch) batch.pending = true; throw error; }
      needed = batch?.pending;
    }
    return !this.unloaded;
  }

  async createBusNextNote(scope, busLabel, noteTitle) {
    const requestedAt = Date.now();
    return this.withIdentityMutation(async () => {
      const batch = { pending: false, timings: { queueMs: Date.now() - requestedAt } };
      this.busViewRefreshBatch = batch;
      try {
      if (!scope) throw new Error("未定位到 BUS 系列");
      const snapshot = await this.loadRawIndexForWrite();
      this.requireIdentityRegistry(snapshot.raw);
      const keyword = snapshot.raw.keywords?.[scope.keywordId];
      const freshScope = this.findBusScopeForKeywordPrefix(scope.keywordId, scope.prefixParts, snapshot.raw.keywords);
      if (!keyword || keyword.identityStatus === "unavailable" || !freshScope
        || freshScope.baseKeyword !== scope.baseKeyword
        || freshScope.latestBusPart !== scope.latestBusPart) {
        throw new Error("BUS 末端或关键词已变化，请扫描并重新打开顺延预览；本次未创建笔记");
      }
      return await this.createBusNextNoteInTransaction(scope, busLabel, noteTitle, snapshot);
      } finally {
        try { await this.flushBusViewRefreshes(); }
        catch (error) { console.warn("[KeywordIndex][bus.refresh-pending]", error); }
        finally {
          // Release queue ownership even on failure, retaining invalidation for the next explicit refresh/event.
          if (batch.pending && !this.unloaded) this.busViewRefreshPending = true;
          if (this.busViewRefreshBatch === batch) this.busViewRefreshBatch = null;
          console.info("[KeywordIndex][bus.performance]", { ...batch.timings, totalMs: Date.now() - requestedAt });
        }
      }
    });
  }

  async createBusNextNoteInTransaction(scope, busLabel, noteTitle, snapshot) {
    if (!scope) throw new Error("未定位到 BUS 系列");
    const safeBusLabel = text(busLabel);
    if (!safeBusLabel) throw new Error("BUS 抽屉名称不能为空");
    if (safeBusLabel.includes("+")) throw new Error("BUS 抽屉名称不能包含 + 号");
    const safeNoteTitle = text(noteTitle);
    if (!safeNoteTitle) throw new Error("新笔记标题不能为空");
    if (hasIllegalFileNameChars(safeNoteTitle)) throw new Error('新笔记标题不能包含 \\ / : * ? " < > |');

    const nextBusPart = buildBusSegment(scope.latestBusNumber + 1, scope.latestBusWidth, safeBusLabel);
    const preview = this.previewBusNextNote(scope, safeNoteTitle, nextBusPart);
    if (preview.error) throw new Error(preview.error);
    if (await this.app.vault.adapter.exists(preview.newFilePath)) throw new Error(`目标文件已存在：${preview.newFilePath}`);

    const sourceContent = await this.app.vault.read(preview.sourceFile);
    const sourceFrontmatter = this.app.metadataCache.getFileCache(preview.sourceFile)?.frontmatter || {};
    const baseYaml = {
      qishiriqidate: todayDateString(),
      qishiriqitime: currentTimeString(),
      atomle: true,
      antinet: "atom",
      "树的结构": true,
      crab_canon: [10, 7, todayDateString(7), null],
    };
    if (sourceFrontmatter["所属块"]) baseYaml["所属块"] = sourceFrontmatter["所属块"];
    const parentLink = this.buildParentLink(preview.newCode);
    if (parentLink) baseYaml["上级条目"] = parentLink;

    const yamlLines = ["---"];
    Object.entries(baseYaml).forEach(([key, value]) => yamlLines.push(`${key}: ${yamlScalar(value, key === "上级条目")}`));
    yamlLines.push(buildKeywordYamlBlock([preview.nextKeywordText]));
    yamlLines.push("---", "");

    const inlineFields = this.extractInlineFields(sourceContent);
    const newContent = inlineFields.length > 0 ? `${yamlLines.join("\n")}\n${inlineFields.join("\n")}\n` : `${yamlLines.join("\n")}\n`;
    const noteStartedAt = Date.now();
    const file = await this.app.vault.create(preview.newFilePath, newContent);
    const timings = this.busViewRefreshBatch?.timings || {};
    timings.noteWriteMs = Date.now() - noteStartedAt;
    const indexStartedAt = Date.now();
    let indexPending = false;
    try {
      await this.addCreatedBusNoteToIndex(scope, file, nextBusPart, preview.nextKeywordText, snapshot);
    } catch (error) {
      indexPending = true;
      console.error("[KeywordIndex][bus.create.index-pending]", { file: file.path, keywordId: scope.keywordId, error: error.message });
    }
    timings.indexAndPublishMs = Date.now() - indexStartedAt;
    const result = { file, newCode: preview.newCode, nextBusPart, nextKeywordText: preview.nextKeywordText, indexPending };
    const viewStartedAt = Date.now();
    try {
      const origin = scope.originView;
      const prepared = origin instanceof KeywordIndexView && origin.plugin === this && origin.prepareBusCreatedState(scope, result);
      const refreshed = await this.flushBusViewRefreshes(true);
      result.originViewRefreshed = !!(prepared && refreshed && origin.isBusOriginCurrent(scope));
      timings.viewRefreshMs = Date.now() - viewStartedAt;
      const openStartedAt = Date.now();
      await this.openFileInLastMarkdownTabGroup(file, "bus-create");
      timings.openFileMs = Date.now() - openStartedAt;
    } catch (error) {
      console.warn("[KeywordIndex][bus.create.view-pending]", { file: file.path, indexPending, error: error.message });
      new Notice("笔记已创建；页面刷新或打开失败，可重新打开关键词视图和笔记。");
    }
    return result;
  }

  async addCreatedBusNoteToIndex(scope, file, nextBusPart, nextKeywordText, { indexPath, raw, rawText }) {
    const keyword = raw.keywords?.[scope.keywordId];
    if (!keyword || !file) throw new Error("BUS 索引登记目标不存在");
    const suffix = buildSuffixFromParts([...scope.prefixParts, nextBusPart]);
    keyword.notes = Array.isArray(keyword.notes) ? keyword.notes : [];
    const exists = keyword.notes.some((note) => text(note.path) === file.path && text(note.suffix) === suffix && text(note.sourceType, keyword.type) === "yaml");
    if (!exists) {
      keyword.notes.push({ path: file.path, name: file.basename, suffix, sourceType: "yaml" });
    }
    keyword.type = text(keyword.type, "yaml");
    keyword.sortKey = computeSortKey(keyword.notes);
    // Add identities without treating unrelated stale registrations as deletions.
    const descriptors = new Map();
    for (const record of raw.identityRegistry.nodes.filter((record) => record.status === "active")) {
      descriptors.set(identity.descriptorKey(record), {
        kind: record.kind, keywordId: record.keywordId, type: record.type,
        scope: record.scope, pathParts: [...record.pathParts],
      });
    }
    for (const descriptor of this.identityDescriptors({ [keyword.id]: keyword })) {
      descriptors.set(identity.descriptorKey(descriptor), descriptor);
    }
    const desired = [...descriptors.values()];
    if (identity.preview(raw.identityRegistry, desired).missing.length) throw new Error("BUS 顺延不得移除既有身份");
    raw.identityRegistry = identity.reconcile(raw.identityRegistry, desired, {}, indexPath);
    const txId = identity.allocate("kwbus-", new Set());
    const saved = await this.safeWriteKeywordIndex(indexPath, raw, txId, rawText);
    console.info("[KeywordIndex][bus.create.saved]", { txId, file: file.path, keywordId: keyword.id, backupPath: saved.backupPath, published: saved.published });
  }
};
