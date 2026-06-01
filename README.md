# arqeno — site (marketing)

Site institucional/landing da Arqeno. **Projeto estático, 100% isolado do app Laravel.**
Mudar qualquer coisa aqui **nunca** afeta o painel admin nem o app dos tenants.

```
index.html         → arqeno.com.br (landing)
privacidade.html   → arqeno.com.br/privacidade
favicon.svg
```

Sem build, sem dependências: é só HTML/CSS/JS. Abra `index.html` no navegador pra ver localmente.

---

## Arquitetura (quem responde o quê)

| Endereço | Vai para |
|---|---|
| `arqeno.com.br` (raiz + /privacidade) | **este site** (host estático) |
| `admin.arqeno.com.br` | VPS (Laravel — painel admin) |
| `*.arqeno.cloud` (tenants) | VPS (Laravel — o app) |
| `arqeno.cloud` (raiz, portal) | VPS por enquanto (pode migrar pra cá depois) |

Como os painéis ficam em **subdomínios**, apontar só a **raiz** `arqeno.com.br` pra cá não mexe em nada do app.

---

## Deploy recomendado — Cloudflare Pages (grátis)

1. Crie um repositório no GitHub (ex.: `arqeno-site`) e suba esta pasta:
   ```
   git remote add origin https://github.com/SEU_USUARIO/arqeno-site.git
   git push -u origin main
   ```
2. cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → selecione o repo.
3. Build settings: **Framework preset = None**, **Build command = (vazio)**, **Build output directory = `/`**. Deploy.
4. Vai gerar uma URL de preview tipo `arqeno-site.pages.dev` — abra e confira.
5. **Custom domains** (na aba do projeto Pages) → adicione `arqeno.com.br` e `www.arqeno.com.br`.
6. **DNS** (no painel de DNS do domínio):
   - `arqeno.com.br` → registro que o Cloudflare Pages indicar (CNAME para `*.pages.dev`, com flattening no apex — o Cloudflare faz isso automático se o DNS estiver nele).
   - `www` → CNAME para o mesmo.
   - **NÃO mexa** em `admin` nem em `*.arqeno.cloud` — continuam apontando pro VPS.

> Alternativas equivalentes (também grátis, mesmo fluxo): **Netlify** ou **Vercel** (arraste a pasta ou conecte o repo; output dir = raiz). Se preferir **Hostinger**, suba os arquivos via gerenciador de arquivos numa hospedagem estática e aponte o domínio — funciona igual, mas sem preview automático.

---

## Cada alteração (fluxo de iteração)

1. Edite `index.html` (ou peça pro Claude).
2. `git commit -am "ajuste" && git push`.
3. Cloudflare/Netlify/Vercel publica sozinho e gera **URL de preview**.
4. Aprovou → vira produção. Não gostou → **rollback em 1 clique** no painel do host.

Zero risco pro painel/app.

---

## Antes de cortar o DNS (checklist)

- [ ] Site no ar na URL de preview, OK no desktop e mobile.
- [ ] `/privacidade` abrindo.
- [ ] Links conferidos: **Entrar/Acesso** → `admin.arqeno.com.br/admin`; e-mails de contato.
- [ ] Depois que `arqeno.com.br` apontar pra cá, **remover** as rotas `landlord.home` e `/privacidade` do Laravel (ou deixar — não serão mais acessadas pela raiz). O link `route('legal.privacidade')` usado dentro do app deve passar a apontar para `https://arqeno.com.br/privacidade`.
