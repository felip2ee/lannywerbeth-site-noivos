# Build lightweight static server container
FROM nginx:alpine

# Credenciais PÚBLICAS do Supabase (anon key é publicável, protegida por RLS).
# Chegam como build-args via GitHub Actions (repo variables).
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

# Remove default nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy our static website files to the nginx public directory
COPY . /usr/share/nginx/html/

# Gera o supabase-config.js a partir dos build-args (falha o build se vierem vazios)
RUN test -n "$SUPABASE_URL" && test -n "$SUPABASE_ANON_KEY" || \
      (echo "ERRO: SUPABASE_URL e SUPABASE_ANON_KEY sao obrigatorios" && exit 1) && \
    printf 'const SUPABASE_URL      = "%s";\nconst SUPABASE_ANON_KEY = "%s";\n\nconst sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);\n' \
      "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > /usr/share/nginx/html/supabase-config.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
