# Política de Segurança

Obrigado por ajudar a manter o FotoQR e os dados dos usuários seguros. Este documento explica quais versões recebem correções e como reportar uma vulnerabilidade de forma privada.

## Versões suportadas

O FotoQR é publicado continuamente a partir da branch `main`. Apenas a versão em produção (o último commit da `main`) recebe correções de segurança.

| Versão               | Suportada |
| -------------------- | --------- |
| `main` (produção)    | ✅        |
| Branches antigas/forks | ❌      |

## Como reportar uma vulnerabilidade

**Não abra issues, pull requests ou discussões públicas para relatar falhas de segurança.**

Use o canal privado do GitHub:

1. Acesse a aba **Security** deste repositório.
2. Clique em **Report a vulnerability**, ou abra diretamente:
   <https://github.com/luizcsbh/fotoqr-frontend/security/advisories/new>
3. Preencha o formulário. O relato fica visível apenas para os mantenedores.

Se a falha estiver na API (servidor), reporte em
<https://github.com/luizcsbh/fotoqr-backend/security/advisories/new>. Em caso de dúvida, use qualquer um dos dois: os mantenedores encaminham internamente.

### O que incluir no relato

- Descrição da vulnerabilidade e do impacto (ex.: XSS, vazamento de token, acesso a fotos de outro evento).
- Página, componente ou rota afetada (ex.: galeria, telão, página de upload, links de acesso da equipe).
- Passos para reproduzir e, se possível, uma prova de conceito (URL, payload, captura de tela ou vídeo).
- Navegador/dispositivo, versão/commit testado e ambiente (produção, local).
- Qualquer sugestão de correção ou mitigação.

Não inclua dados pessoais reais de terceiros no relato. Use contas e eventos de teste criados por você.

## Nosso compromisso

| Etapa                                  | Prazo alvo            |
| -------------------------------------- | --------------------- |
| Confirmação de recebimento             | até 3 dias úteis      |
| Avaliação inicial e classificação      | até 7 dias úteis      |
| Correção de falhas críticas/altas      | até 30 dias           |
| Correção de falhas médias/baixas       | até 90 dias           |

Manteremos você informado pelo próprio advisory privado. Quando a correção estiver publicada, o advisory poderá ser divulgado (com CVE, quando aplicável) e você será creditado, se desejar.

## Escopo

**Dentro do escopo**

- Aplicação web (`fotoqr-frontend`): XSS, injeção de conteúdo, vazamento de tokens ou sessões, redirecionamentos abertos, exposição de dados de eventos privados, falhas no fluxo de consentimento de cookies.
- API do backend (`fotoqr-backend`): autenticação, controle de acesso a eventos e fotos, upload e download.
- Segredos ou credenciais expostos no bundle publicado ou no repositório.

**Fora do escopo**

- Ataques de negação de serviço volumétricos (DoS/DDoS) ou testes de carga contra produção.
- Engenharia social, phishing ou ataques físicos.
- Vulnerabilidades em serviços de terceiros (Render, Google AdSense, Spotify, Deezer, Sightengine) — reporte-as ao respectivo fornecedor.
- Variáveis `VITE_*` que são públicas por definição (URL da API, ID de cliente do AdSense, verificação do Google).
- Relatos gerados apenas por scanners automáticos, sem impacto demonstrado.
- Ausência de cabeçalhos ou boas práticas sem exploração concreta.
- Self-XSS ou falhas que exigem dispositivo da vítima já comprometido ou navegador desatualizado.

## Regras para pesquisa de boa-fé

Ao testar, por favor:

- Use apenas contas e eventos que você mesmo criou.
- Não acesse, altere ou exclua dados de outros usuários além do mínimo necessário para demonstrar a falha; se acessar dados de terceiros por acidente, pare e nos informe.
- Não degrade o serviço nem envie spam (e-mails, convites, uploads em massa).
- Dê um prazo razoável para a correção antes de qualquer divulgação pública.

Pesquisas conduzidas de boa-fé e de acordo com esta política não serão alvo de ação por parte dos mantenedores.

## Dependências

As dependências são monitoradas pelo Dependabot. Vulnerabilidades já públicas em bibliotecas (npm) podem ser reportadas normalmente via advisory privado, ou via pull request caso a correção seja apenas atualizar a versão.
