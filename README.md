# Remix 3 MCP Demo

This project demonstrates how to build interactive MCP (Model Context Protocol)
widgets that run on Cloudflare Workers and can be embedded in AI chat interfaces
like ChatGPT. It showcases the power of combining MCP with modern web
technologies to create rich, stateful experiences within AI conversations.

## Demo Video

See the calculator widget in action with ChatGPT, including the hidden TRON
easter egg:

https://github.com/user-attachments/assets/5df110d8-f40b-4c6a-8820-c2dbf3ff79c8

[Watch the demo on X/Twitter](https://x.com/kentcdodds/status/1978219213904044051)

## How the Demo Works

### Architecture Overview

This demo implements a **calculator widget** as an MCP tool that can be invoked
by AI assistants. The architecture consists of several key components:

1. **MCP Server** - A Cloudflare Durable Object that implements the Model
   Context Protocol
2. **Widget System** - Interactive UI components built with Remix 3 that can be
   embedded in AI chats
3. **Two-way Communication** - Widgets can both receive initial state from the
   AI and send messages back
4. **Static Assets** - Widget bundles served from Cloudflare's CDN

### The Calculator Widget

The calculator is a fully functional, beautifully styled calculator with a
retro-futuristic aesthetic inspired by Tron. Here's what makes it special:

#### Initial State Configuration

When an AI assistant invokes the calculator tool, it can pass initial state
parameters:

- `display` - The initial display value
- `previousValue` - A value already entered (e.g., "I want to add 5 to a
  number")
- `operation` - The pending operation (+, -, \*, /)
- `waitingForNewValue` - Whether the calculator is ready for new input
- `errorState` - Whether to start in an error state

This means the AI can pre-configure the calculator based on the user's request.
For example, if a user says "I want to add 5 to something," the AI can invoke
the calculator with `previousValue: 5`, `operation: '+'`, and
`waitingForNewValue: true`.

#### Interactive UI

The calculator widget is a fully interactive Remix application that:

- Renders using JSX/TSX with CSS-in-JS styling
- Supports keyboard shortcuts (Enter, Escape, number keys, operators, etc.)
- Features a Tron-style initialization sequence with animated loading messages
- Updates in real-time as users interact with it
- Uses Remix 3's experimental DOM renderer for efficient updates

#### The Easter Egg: The Master Control Program

There's a hidden feature in the calculator: when the result equals **1982** (the
year the original Tron film was released), the calculator sends an MCP prompt
message to the AI assistant, instructing it to adopt the persona of the Master
Control Program (MCP) from Tron.

This demonstrates the widget's ability to **dynamically influence the
conversation** by sending messages back to the AI.

### Technical Implementation

#### MCP Server with Durable Objects

The `MathMCP` class extends `McpAgent` and uses Cloudflare's Durable Objects to
maintain state:

```typescript
export class MathMCP extends McpAgent<Env, State, Props> {
	server = new McpServer(
		{
			name: 'MathMCP',
			version: '1.0.0',
		},
		{
			instructions: `Use this server to solve math problems reliably and accurately.`,
		},
	)
	async init() {
		await registerTools(this)
		await registerWidgets(this)
	}
}
```

The server registers two types of capabilities:

1. **Tools** - A `do_math` tool that performs arithmetic operations server-side
2. **Widgets** - Interactive UI resources that can be embedded in the chat

#### Widget Registration

Widgets are registered as MCP Apps resources (for the HTML/JS bundle) and MCP
tools (for invocation). The registration includes:

- **Input Schema** - Zod schemas defining what parameters the widget accepts
- **Output Schema** - Zod schemas defining what the widget can return
- **HTML Bundle** - The rendered HTML with script references
- **MCP Apps Metadata** - Standard `_meta.ui.resourceUri` and resource CSP
  settings for any MCP Apps-compatible host

```typescript
registerAppResource(agent.server, name, uri, {
	description: widget.description,
	_meta: {
		ui: {
			csp: {
				connectDomains: [],
				resourceDomains: [baseUrl],
			},
		},
	},
}, async () => ({
	contents: [
		createUIResource({
			uri,
			encoding: 'text',
			content: {
				type: 'rawHtml',
				htmlString: await widget.getHtml(),
			},
		}).resource,
	],
}))

registerAppTool(agent.server, name, {
	title: widget.title,
	description: widget.description,
	inputSchema: widget.inputSchema,
	outputSchema: widget.outputSchema,
	_meta: {
		ui: { resourceUri: uri },
	},
}, handler)
```

#### Separate Build Process

The project uses two separate build processes:

1. **Widget Build** (Vite) - Builds the calculator UI into standalone JavaScript
   bundles
   - Input: `worker/widgets/calculator/index.tsx`
   - Output: `dist/public/widgets/calculator.js`
   - Format: ES modules with all dependencies bundled

2. **Worker Build** (Wrangler) - Builds the Cloudflare Worker with MCP server
   - Input: `worker/index.tsx`
   - Output: Worker bundle deployed to Cloudflare
   - Includes: MCP protocol handlers, tool registration, widget serving

#### Communication Protocol

Widgets communicate with their parent frame (the AI chat interface) using the
MCP Apps JSON-RPC bridge (`ui/*` methods) via the `App` class:

- **Initialization** - Widget calls `ui/initialize` with `App.connect()`
- **Tool Input** - Host sends `ui/notifications/tool-input`
- **Tool Calls** - Widget calls `tools/call` via `app.callServerTool()`
- **Messages** - Widget sends `ui/message` via `app.sendMessage()`
- **Links** - Widget requests `ui/open-link` via `app.openLink()`

```typescript
const app = new App({ name: 'calculator-widget', version: '1.0.0' })
app.ontoolinput = ({ arguments: toolInput }) => {
	console.log('toolInput', toolInput)
}
await app.connect()

// Widget sends a prompt to the AI
await app.sendMessage({
	role: 'user',
	content: [{ type: 'text', text: MCP_PROMPT }],
})
```

### The User Experience

Here's what happens when a user interacts with this MCP server in ChatGPT:

1. User asks: "Can I get a calculator?"
2. ChatGPT invokes the `calculator` tool via MCP
3. The tool metadata links to the UI resource via `_meta.ui.resourceUri`
4. ChatGPT fetches the `ui://` resource, renders the widget in an iframe, and
   sends tool input via `ui/notifications/tool-input`
5. The widget loads, shows a Tron-style initialization sequence, then displays
   the calculator
6. User interacts with the calculator (clicking buttons or using keyboard)
7. If the result is 1982, the widget sends a prompt back to ChatGPT
8. ChatGPT adopts the MCP persona and responds accordingly

## Running on Your Own

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Cloudflare account (for deployment)

### Local Development

1. **Clone and Install**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   This runs two processes concurrently:
   - Widget build in watch mode (Vite)
   - Worker with local Durable Objects (Wrangler)

3. **Test the Calculator Widget**

   Visit `http://localhost:8787/__dev/widgets` to see the calculator widget in
   isolation.

4. **Connect to MCP Inspector**

   Use the MCP Inspector to test the MCP server:

   ```bash
   npm run inspect
   ```

   Then connect to `http://localhost:8787/mcp` in the inspector.

### Deployment

1. **Build for Production**

   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**

   ```bash
   npm run deploy
   ```

3. **Use with ChatGPT**

   Once deployed, you can add this MCP server to ChatGPT by providing the
   deployment URL + `/mcp` endpoint.

### Project Structure

```
├── worker/
│   ├── index.tsx              # Main worker entry point
│   ├── tools.ts               # MCP tool definitions (do_math)
│   ├── widgets.tsx            # Widget registration system
│   ├── utils.ts               # CORS and utility functions
│   └── widgets/
│       ├── utils.ts           # Widget communication utilities
│       └── calculator/
│           ├── index.tsx      # Calculator UI component
│           ├── calculator.ts  # Calculator business logic
│           └── mcp-prompt.ts  # The MCP easter egg prompt
├── dist/
│   └── public/
│       └── widgets/
│           └── calculator.js  # Built calculator bundle
├── vite.config.widgets.ts     # Vite config for widget builds
└── wrangler.jsonc             # Cloudflare Workers config
```

### Key Technologies

- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge computing
  platform
- **[Durable Objects](https://developers.cloudflare.com/durable-objects/)** -
  Stateful coordination primitives
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Protocol for
  AI-to-service communication
- **[Remix 3](https://remix.run/)** - React framework (experimental DOM
  renderer)
- **[Vite](https://vitejs.dev/)** - Fast build tool for widget bundles
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Environment & Configuration

The `wrangler.jsonc` configures:

- Durable Object binding (`MATH_MCP_OBJECT`)
- Assets binding for serving widget bundles
- Node.js compatibility for MCP SDK
- Observability for production monitoring

### Development Tips

- **Widget Development**: Changes to widget code will hot-reload automatically
- **Worker Changes**: Wrangler will restart the worker on file changes
- **Type Safety**: Run `npm run typecheck` to validate TypeScript
- **Linting**: Run `npm run lint` to check code style

## Credits

This demo showcases cutting-edge web technologies including experimental Remix 3
features, MCP widgets, and Cloudflare's edge computing platform. The calculator
design pays homage to the aesthetic of Tron, with its distinctive orange glow
and retro-futuristic style.
