# 鬼灭之刃 3D刀战原型（可运行）

你这次报错：

```text
python3: can't open file '/Users/leomac/web-demo/run_demo.py': No such file or directory
```

原因是你在 `~` 目录执行了相对路径命令，系统会去找 `~/web-demo/run_demo.py`，但这个文件不在你的家目录里。

---

## 最稳妥启动方式（推荐）

### 方式 A：先进入仓库再启动

```bash
cd /你的仓库路径/clawPigmentstudio
python3 run_demo.py
```

### 方式 B：不切目录，直接用绝对路径启动

```bash
python3 /你的仓库路径/clawPigmentstudio/run_demo.py
```

启动后打开：

```text
http://localhost:8000/web-demo/
```

## macOS 双击启动

仓库根目录新增了 `run_demo.command`，双击即可启动本地服务。

## 旧命令兼容

以下命令仍可用（前提：你已经在仓库根目录）：

```bash
python3 web-demo/run_demo.py
```

## 操作说明

- `WASD`：移动
- `J`：轻斩
- `K`：重斩
- `L`：格挡（按下瞬间有弹反窗口）
- `Shift`：冲刺

## 项目结构

- `run_demo.py`：仓库根目录启动脚本（推荐）
- `run_demo.command`：macOS 双击启动脚本
- `web-demo/index.html`：页面与HUD
- `web-demo/style.css`：界面样式
- `web-demo/main.js`：Three.js 3D战斗逻辑
- `web-demo/run_demo.py`：子目录启动脚本（兼容保留）

## 常见问题

### 1) 404 Not Found

原因：HTTP 服务不是从仓库目录指向，URL 对应目录不存在。

解决：使用 `python3 run_demo.py`（推荐）或绝对路径启动方式。

### 2) 端口被占用

```bash
python3 run_demo.py --port 9000
```

然后打开：`http://localhost:9000/web-demo/`
