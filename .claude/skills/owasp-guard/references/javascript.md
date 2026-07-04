# JavaScript / TypeScript Security Reference (Node.js, Express, React, Next.js)

Routing map: which OWASP Cheat Sheets to fetch for JS/TS projects.

## OWASP Cheat Sheets by Category

### A01 — Broken Access Control
- Access_Control_Cheat_Sheet.md
- Authorization_Cheat_Sheet.md
- Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.md
- Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.md
- Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md

### A02 — Security Misconfiguration
- HTTP_Headers_Cheat_Sheet.md
- Content_Security_Policy_Cheat_Sheet.md
- Docker_Security_Cheat_Sheet.md (if containerized)
- NodeJS_Docker_Cheat_Sheet.md (if Node.js in Docker)

### A03 — Software Supply Chain Failures
- Software_Supply_Chain_Security_Cheat_Sheet.md
- Dependency_Graph_SBOM_Cheat_Sheet.md
- NPM_Security_Cheat_Sheet.md

### A04 — Cryptographic Failures
- Cryptographic_Storage_Cheat_Sheet.md
- Password_Storage_Cheat_Sheet.md
- Key_Management_Cheat_Sheet.md
- HTTP_Strict_Transport_Security_Cheat_Sheet.md
- Secrets_Management_Cheat_Sheet.md

### A05 — Injection
- SQL_Injection_Prevention_Cheat_Sheet.md
- Injection_Prevention_Cheat_Sheet.md
- Cross_Site_Scripting_Prevention_Cheat_Sheet.md
- DOM_based_XSS_Prevention_Cheat_Sheet.md
- DOM_Clobbering_Prevention_Cheat_Sheet.md
- OS_Command_Injection_Defense_Cheat_Sheet.md
- Input_Validation_Cheat_Sheet.md
- Query_Parameterization_Cheat_Sheet.md
- Prototype_Pollution_Prevention_Cheat_Sheet.md
- NoSQL_Security_Cheat_Sheet.md (if using MongoDB or similar)

### A06 — Insecure Design
- Secure_Product_Design_Cheat_Sheet.md
- Abuse_Case_Cheat_Sheet.md
- Attack_Surface_Analysis_Cheat_Sheet.md
- Denial_of_Service_Cheat_Sheet.md

### A07 — Authentication Failures
- Authentication_Cheat_Sheet.md
- Session_Management_Cheat_Sheet.md
- JSON_Web_Token_for_Java_Cheat_Sheet.md (JWT guidance applies cross-language)
- Forgot_Password_Cheat_Sheet.md
- Credential_Stuffing_Prevention_Cheat_Sheet.md
- Multifactor_Authentication_Cheat_Sheet.md

### A08 — Software or Data Integrity Failures
- Deserialization_Cheat_Sheet.md

### A09 — Security Logging and Alerting Failures
- Logging_Cheat_Sheet.md
- Logging_Vocabulary_Cheat_Sheet.md

### A10 — Mishandling of Exceptional Conditions
- Error_Handling_Cheat_Sheet.md

## Framework-Specific Cheat Sheets

### Node.js
- Nodejs_Security_Cheat_Sheet.md

### React / Next.js
- HTML5_Security_Cheat_Sheet.md
- Securing_Cascading_Style_Sheets_Cheat_Sheet.md

### Express / REST APIs
- REST_Security_Cheat_Sheet.md
- GraphQL_Cheat_Sheet.md (if using GraphQL)

## Language Detection Signals

Detect JS/TS projects by presence of:
- `*.js`, `*.ts`, `*.jsx`, `*.tsx` files
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `tsconfig.json`, `next.config.js`, `next.config.mjs`
- Imports: `express`, `react`, `next`, `fastify`, `koa`

## Package Ecosystem for OSV.dev

When verifying packages, use ecosystem: `npm`
