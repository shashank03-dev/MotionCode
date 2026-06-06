# MotionCode

**Video motion analysis for production code snippets.**

MotionCode helps turn video motion references into implementation-ready animation snippets. The browser extracts frames from supported media, the server-side Gemini endpoint analyzes those frames, and the app returns validated CSS, GSAP, Framer Motion, and React Spring code.



## Features

- **Video-to-Code Analysis**: Upload MP4, WebM, MOV, or GIF media and extract frames in the browser.
- **Server-Side Gemini Analysis**: `/api/analyze` sends extracted JPEG frames to Gemini using a server-only API key.
- **Validated Code Output**: Gemini responses are normalized before display as CSS, GSAP, Framer Motion, and React Spring snippets.
- **Usage Guardrails**: Free analysis requests are rate-limited before Gemini is called.
- **Modern UI**: Dark-themed upload, analysis, and code output panels built for motion review.

## Getting Started

### Prerequisites

- Node.js 20.19.x or newer
- npm

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/shashank03-dev/MotionCode.git
   cd MotionCode
   ```

2. **Install dependencies:**

   ```bash
   npm ci
   ```

3. **Set up Environment Variables:**

   Create `.env.local` and provide the server-side Gemini key:

   ```bash
   GEMINI_API_KEY=your_key_here
   UPSTASH_REDIS_REST_URL=your_redis_rest_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the platform in action.

## Built With

- **Next.js 16** - React Framework
- **GSAP** - Animation Library
- **Framer Motion** - Motion library for React
- **Google Gemini API** - Server-side frame analysis
- **Zod** - Request and response validation
- **Tailwind CSS** - Styling
- **Vitest** - Unit testing

## Production Readiness

See [docs/production-readiness.md](docs/production-readiness.md) for the current production posture, required environment variables, security controls, verification commands, and known follow-up work.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Crafted with ❤️ by [shashank](https://github.com/shashank03-dev)
