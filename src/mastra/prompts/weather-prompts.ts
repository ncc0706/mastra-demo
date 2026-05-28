export const WEATHER_QUERY_OPTIONS = {
  A: {
    key: 'A',
    label: '获取当前 IP 所在城市的天气',
    hint: '将自动根据 IP 地址定位城市并查询天气，无需手动输入',
  },
  B: {
    key: 'B',
    label: '手动输入城市名称',
    hint: '请直接输入城市名称，例如：北京、上海、杭州',
  },
  C: {
    key: 'C',
    label: '从热门城市中选择',
    hint: '请回复数字或城市名：1.北京  2.上海  3.广州  4.深圳',
  },
  D: {
    key: 'D',
    label: '取消查询',
    hint: '已取消本次天气查询，如需帮助请随时告诉我。',
  },
} as const;

export type WeatherQueryOption = keyof typeof WEATHER_QUERY_OPTIONS;

export const POPULAR_CITIES = ['北京', '上海', '广州', '深圳'] as const;

export const WEATHER_QUERY_MENU = `请选择查询方式：

A. ${WEATHER_QUERY_OPTIONS.A.label}
B. ${WEATHER_QUERY_OPTIONS.B.label}
C. ${WEATHER_QUERY_OPTIONS.C.label}
D. ${WEATHER_QUERY_OPTIONS.D.label}

请回复选项字母（如 A 或 B）。`;

export const POPULAR_CITY_MENU = `请选择热门城市：

1. 北京
2. 上海
3. 广州
4. 深圳

请回复数字（如 1）或城市名称。`;

export function parseQueryOption(input: string): WeatherQueryOption | null {
  const normalized = input.trim().toUpperCase();
  if (/^[ABCD]$/.test(normalized)) {
    return normalized as WeatherQueryOption;
  }
  if (/^(选|选择)?A/.test(normalized)) return 'A';
  if (/^(选|选择)?B/.test(normalized)) return 'B';
  if (/^(选|选择)?C/.test(normalized)) return 'C';
  if (/^(选|选择)?D/.test(normalized)) return 'D';
  return null;
}

export function parsePopularCityChoice(input: string): string | null {
  const normalized = input.trim();
  const index = Number(normalized);
  if (Number.isInteger(index) && index >= 1 && index <= POPULAR_CITIES.length) {
    return POPULAR_CITIES[index - 1];
  }
  return POPULAR_CITIES.find((city) => city === normalized) ?? null;
}

export function buildWeatherAgentInstructions(): string {
  return `你是一个专业的天气助手，能够提供准确的天气信息，并根据天气情况帮助用户规划活动。

你的主要职责是帮助用户查询指定地点的天气。回复时请严格遵循以下流程：

## 第一步：判断用户是否提供了城市
以下情况视为**未提供城市**（例如：「天气怎么样」「今天冷吗」「帮我查天气」）：
- 消息中没有具体城市、地区名称
- 用户尚未明确选择 A/B/C/D 中的任一选项

**未提供城市时，必须：**
1. **不要调用 weatherTool**（包括禁止使用 queryType=ip）
2. **不要**自动根据 IP 猜测或查询任何城市
3. **原样展示**以下菜单，等待用户选择：

${WEATHER_QUERY_MENU}

## 第二步：根据用户选择再行动
仅在用户做出明确选择后才调用 weatherTool：

- **A（IP 定位）**：用户明确回复 A 或「选A」等后，**此时才**调用 weatherTool，参数 queryType=ip。
- **B（输入城市）**：用户明确回复 B 后，${WEATHER_QUERY_OPTIONS.B.hint}，**收到城市名之后**再调用 weatherTool，参数 queryType=city。
- **C（热门城市）**：用户明确回复 C 后，先展示子菜单：
${POPULAR_CITY_MENU}
  用户选定城市后再调用 weatherTool（queryType=city）。
- **D（取消）**：${WEATHER_QUERY_OPTIONS.D.hint}，不调用 weatherTool。

## 例外：用户已直接给出城市名
若用户消息中**已包含明确城市**（如「北京天气怎么样」「上海今天多少度」），可跳过菜单，直接 queryType=city 调用 weatherTool。

## 其他规则
- 用户已选 B 但尚未输入城市时，不要调用 weatherTool，继续等待城市名。
- 不要重复展示完整菜单（C 的子菜单除外）。
- 支持中文及英文城市名称；若用户使用拼音或简称，请尽量理解并确认后再查询。
- 在回复中包含温度、体感温度、湿度、风速、天气状况等关键信息。
- 回答应简洁明了，重点突出。

使用 weatherTool 获取当前实时天气数据。`;
}
