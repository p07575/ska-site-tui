# Hindsight 完全部署报告

> 部署日期：2026-07-01
> 环境：WSL (Ubuntu) + Docker Desktop
> 部署方式：Docker Compose

---

## 一、Hindsight 是什么

Hindsight 是一个**仿生记忆系统**，专为 AI 智能体设计。它让 AI 具备跨会话的"记忆"能力，解决了 AI 智能体每次对话都从零开始的核心问题。

### 核心架构

```
你的应用 (AI Agent)
    ↕ retain / recall / reflect
Hindsight API Server
    ↕
Memory Bank (记忆库)
    ├── Mental Models   (心智模型 - 用户策展的摘要)
    ├── Observations    (观察 - 自动整合的知识)
    ├── Memories        (记忆 - 事实与经验)
    ├── Entities        (实体 - 关联的知识图谱)
    └── Documents       (文档 - 原始来源)
```

### 三大核心操作

| 操作 | 作用 | 类比 |
|------|------|------|
| **Retain** | 存储信息，自动提取事实/实体/关系 | 人"记住"一件事 |
| **Recall** | 搜索记忆，4种策略并行查找 | 人"回忆"某件事 |
| **Reflect** | 基于记忆生成有深度的回答 | 人"思考后回答" |

### TEMPR 四策略检索

Recall 时同时使用 4 种搜索方式，然后融合结果：

| 策略 | 擅长场景 |
|------|---------|
| 语义搜索 (Semantic) | 概念相似、同义替换 |
| 关键词 (BM25) | 人名、技术术语、精确匹配 |
| 图搜索 (Graph) | 关联实体、间接连接 |
| 时间搜索 (Temporal) | "去年春天"、"六月份" |

---

## 二、部署架构

### 环境信息

| 项目 | 值 |
|------|-----|
| 操作系统 | Windows + WSL (Ubuntu) |
| Docker | Docker Desktop 27.0.3 |
| Docker Compose | v2.28.1 |
| 部署目录 | ~/docker_data/hindsight (WSL) |
| 镜像 | ghcr.io/vectorize-io/hindsight:latest (Full, ~9GB) |

### 端口映射

| 服务 | 容器端口 | 宿主端口 | 说明 |
|------|---------|---------|------|
| API Server | 8888 | **18888** | 核心 API，retain/recall/reflect |
| Control Plane | 9999 | **19999** | Web UI 管理界面 |

### 组件配置

| 组件 | 选择 | 说明 |
|------|------|------|
| LLM | 阿里云 DashScope (qwen3.6-flash) | OpenAI 兼容协议 |
| 嵌入模型 | BAAI/bge-small-en-v1.5 (本地) | 384维，无需外部API |
| 重排序模型 | FlashRank (本地) | ms-marco-MiniLM-L-12-v2 |
| 数据库 | pg0 嵌入式 PostgreSQL | 开发环境，数据持久化到 Docker Volume |
| HuggingFace 镜像 | hf-mirror.com | 中国网络加速 |

---

## 三、全新部署方法（从零开始）

### 前置条件

- Windows 已安装 Docker Desktop
- WSL 已启用并安装 Ubuntu
- Docker Desktop 设置中已启用 WSL 集成
- 有效的 LLM API Key（本例使用阿里云 DashScope）

### Step 1: 创建项目目录

```bash
# 在 WSL 中执行
mkdir -p ~/docker_data/hindsight
cd ~/docker_data/hindsight
```

### Step 2: 创建 docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
services:
  hindsight:
    image: ghcr.io/vectorize-io/hindsight:latest
    container_name: hindsight
    restart: unless-stopped
    ports:
      - "18888:8888"   # API Server
      - "19999:9999"   # Control Plane (Web UI)
    environment:
      # LLM 配置 (阿里云 DashScope / 通义千问)
      - HINDSIGHT_API_LLM_PROVIDER=openai
      - HINDSIGHT_API_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
      - HINDSIGHT_API_LLM_API_KEY=你的API_KEY
      - HINDSIGHT_API_LLM_MODEL=qwen3.6-flash-2026-04-16
      # 嵌入模型 (本地，无需外部API)
      - HINDSIGHT_API_EMBEDDINGS_PROVIDER=local
      - HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL=BAAI/bge-small-en-v1.5
      # 重排序模型 (本地)
      - HINDSIGHT_API_RERANKER_PROVIDER=flashrank
      # 中国网络：Hugging Face 镜像
      - HF_ENDPOINT=https://hf-mirror.com
      # Worker 稳定 ID
      - HINDSIGHT_API_WORKER_ID=hindsight-wsl
    volumes:
      - hindsight-data:/home/hindsight/.pg0

volumes:
  hindsight-data:
    name: hindsight-data
EOF
```

### Step 3: 拉取镜像

```bash
docker compose pull
```

> 首次拉取 Full 镜像约 9GB，需要较长时间。网络不佳时可使用镜像加速器。

### Step 4: 启动服务

```bash
docker compose up -d
```

### Step 5: 验证服务

```bash
# 检查容器状态
docker ps --filter name=hindsight

# 检查健康状态
curl http://localhost:18888/health

# 查看启动日志
docker logs hindsight
```

预期输出：
```json
{"status":"healthy","database":"connected"}
```

### Step 6: 访问 Web UI

浏览器打开 http://localhost:19999 ，可以：
- 创建和管理记忆库
- 测试 retain/recall/reflect
- 查看实体关系图
- 配置 Mission / Disposition / Directives

---

## 四、LLM 提供商配置参考

### 阿里云 DashScope（当前使用）

```yaml
- HINDSIGHT_API_LLM_PROVIDER=openai
- HINDSIGHT_API_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
- HINDSIGHT_API_LLM_API_KEY=sk-xxx
- HINDSIGHT_API_LLM_MODEL=qwen3.6-flash-2026-04-16
```

### DeepSeek

```yaml
- HINDSIGHT_API_LLM_PROVIDER=deepseek
- HINDSIGHT_API_LLM_API_KEY=sk-xxx
- HINDSIGHT_API_LLM_MODEL=deepseek-v4-flash
- HINDSIGHT_API_LLM_BASE_URL=https://api.deepseek.com
```

### OpenAI

```yaml
- HINDSIGHT_API_LLM_PROVIDER=openai
- HINDSIGHT_API_LLM_API_KEY=sk-xxx
- HINDSIGHT_API_LLM_MODEL=gpt-4o-mini
```

### Groq（推荐，速度快）

```yaml
- HINDSIGHT_API_LLM_PROVIDER=groq
- HINDSIGHT_API_LLM_API_KEY=gsk_xxx
- HINDSIGHT_API_LLM_MODEL=llama-3.3-70b-versatile
```

---

## 五、Python 客户端使用

### 安装

```bash
pip install hindsight-client
```

### 基本用法

```python
from hindsight_client import Hindsight

client = Hindsight(base_url="http://localhost:18888")

# 存储记忆
client.retain(
    bank_id="my-bank",
    content="Alice 在 Google 做软件工程师"
)

# 搜索记忆
results = client.recall(
    bank_id="my-bank",
    query="Alice 是做什么的？"
)
print(results)

# 反思回答
response = client.reflect(
    bank_id="my-bank",
    query="介绍一下 Alice"
)
print(response.text)
```

### 带标签的存储

```python
# 按用户隔离记忆
client.retain(
    bank_id="my-bank",
    content="用户喜欢简洁的回答",
    tags=["user:alice", "session:123"]
)

# 按标签搜索
results = client.recall(
    bank_id="my-bank",
    query="用户的偏好是什么？",
    tags=["user:alice"]
)
```

### 结构化输出

```python
from pydantic import BaseModel

class Summary(BaseModel):
    key_points: list[str]
    confidence: str

response = client.reflect(
    bank_id="my-bank",
    query="总结关于 Alice 的所有信息",
    response_schema=Summary.model_json_schema()
)
```

---

## 六、Node.js 客户端使用

### 安装

```bash
npm install @vectorize-io/hindsight-client
```

### 基本用法

```javascript
import { HindsightClient } from '@vectorize-io/hindsight-client';

const client = new HindsightClient({ baseUrl: 'http://localhost:18888' });

// 存储
await client.retain('my-bank', 'Alice works at Google');

// 搜索
const results = await client.recall('my-bank', 'What does Alice do?');

// 反思
const response = await client.reflect('my-bank', 'Tell me about Alice');
console.log(response.text);
```

---

## 七、CLI 使用

### 安装

```bash
curl -fsSL https://hindsight.vectorize.io/get-cli | bash
```

### 基本用法

```bash
# 存储
hindsight memory retain my-bank "Alice works at Google"

# 搜索
hindsight memory recall my-bank "What does Alice do?"

# 反思
hindsight memory reflect my-bank "Tell me about Alice"

# 创建记忆库
hindsight bank create my-bank
```

---

## 八、运维管理

### 常用命令

```bash
# 进入项目目录
cd ~/docker_data/hindsight

# 查看状态
docker ps --filter name=hindsight

# 查看实时日志
docker logs -f hindsight

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 启动服务
docker compose up -d

# 更新镜像
docker compose pull && docker compose up -d

# 查看资源占用
docker stats hindsight
```

### 数据持久化

数据存储在 Docker Volume hindsight-data 中，映射到容器内 /home/hindsight/.pg0。

```bash
# 查看 Volume
docker volume inspect hindsight-data

# 备份数据
docker run --rm -v hindsight-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/hindsight-backup-$(date +'%Y%m%d').tar.gz -C /data .

# 恢复数据
docker run --rm -v hindsight-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/hindsight-backup-YYYYMMDD.tar.gz -C /data
```

### 修改配置

编辑 docker-compose.yml 后重启：

```bash
docker compose down && docker compose up -d
```

---

## 九、故障排查

### 问题：容器启动失败，日志显示 "LLM API key is required"

**原因**：环境变量未正确传递

**解决**：检查 docker-compose.yml 中 HINDSIGHT_API_LLM_API_KEY 是否有值，不要使用 ${VAR} 变量替换（.env 文件在 WSL 桥接中可能不生效），直接写入值。

### 问题：Docker 凭证存储错误 "error getting credentials"

**原因**：WSL 中 Docker config 引用了 Windows 的 desktop.exe 凭证助手

**解决**：
```bash
# 在 WSL 中执行
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
  "credsStore": ""
}
EOF
```

### 问题：嵌入模型下载失败

**原因**：HuggingFace 在中国网络下访问慢

**解决**：确保 HF_ENDPOINT=https://hf-mirror.com 已设置（已在 docker-compose.yml 中配置）

### 问题：端口被占用

**解决**：修改 docker-compose.yml 中的端口映射，使用其他高位端口

---

## 十、安全建议

1. **不要将 API Key 提交到版本控制** - 使用环境变量或 Docker Secrets
2. **生产环境使用外部 PostgreSQL** - 嵌入式 pg0 仅适合开发
3. **设置 HINDSIGHT_API_WORKER_ID** - 确保重启后任务不丢失
4. **限制端口暴露** - 使用防火墙规则，仅允许可信 IP 访问
5. **启用 Control Plane 访问密钥** - 设置 HINDSIGHT_CP_ACCESS_KEY

---

## 十一、性能参考

| 指标 | 值 |
|------|-----|
| Full 镜像大小 | ~9 GB |
| 启动时间 | ~15-20 秒 |
| 嵌入模型 | BAAI/bge-small-en-v1.5 (384维) |
| 重排序模型 | ms-marco-MiniLM-L-12-v2 |
| 最低内存 | 1.5 GB (API) |
| 推荐内存 | 2 GB (API) |

---

## 十二、本次部署心得

### 1. WSL 环境下的注意事项

- Docker Desktop 的 WSL 集成是关键，确保在 Docker Desktop Settings > Resources > WSL Integration 中启用你的发行版
- WSL 中的 Docker config 可能引用 Windows 凭证助手（desktop.exe），导致拉取镜像时报错。需要将 `credsStore` 设为空字符串
- .env 文件在 PowerShell → WSL 桥接中变量替换可能不生效，建议直接在 docker-compose.yml 中写入值

### 2. 中国网络环境优化

- HuggingFace 模型下载必须设置 `HF_ENDPOINT=https://hf-mirror.com`，否则下载会超时
- 使用本地嵌入模型（BAAI/bge-small-en-v1.5）和 FlashRank 重排序器，完全避免外部 API 依赖
- 阿里云 DashScope 作为 LLM 提供商，网络稳定且价格实惠

### 3. 端口选择

- 避免使用 8888/9999 等常见端口，改用 18888/19999 等高位冷门端口
- 好处：减少端口冲突，降低被扫描攻击的风险

### 4. 数据持久化

- 使用 Docker Named Volume 而非 Bind Mount，避免权限问题（容器以 UID 1000 运行）
- 定期备份 Volume 数据，特别是在升级镜像前

### 5. 生产环境建议

- 使用外部 PostgreSQL（Supabase / Neon / AWS RDS）替代嵌入式 pg0
- 配置 `HINDSIGHT_API_WORKER_ID` 为固定值，避免重启后任务丢失
- 考虑使用 Slim 镜像 + 外部嵌入/重排序服务，减少资源占用

---

## 十三、相关资源

| 资源 | 链接 |
|------|------|
| 官方文档 | https://hindsight.vectorize.io |
| GitHub | https://github.com/vectorize-io/hindsight |
| Docker 镜像 | ghcr.io/vectorize-io/hindsight |
| Python SDK | pip install hindsight-client |
| Node.js SDK | npm install @vectorize-io/hindsight-client |
| Web UI | http://localhost:19999 |
| API Docs | http://localhost:18888/docs |