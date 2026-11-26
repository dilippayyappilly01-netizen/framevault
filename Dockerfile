FROM node:22-alpine

WORKDIR /app

# Copy application files (zero root npm dependencies — pure Node 22 built-ins + SQLite)
COPY package.json server.js index.html app.js canvas.js styles.css favicon.svg components-data.js ./
COPY backend ./backend
COPY designs ./designs
COPY .agent ./.agent
COPY .claude ./.claude
COPY mcp-server/dist ./mcp-server/dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/app/data/framevault.sqlite
ENV ALLOW_DEMO_CHECKOUT=false

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
