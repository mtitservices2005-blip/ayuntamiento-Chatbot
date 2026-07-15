# CM-030 Demo Fallback Inventory

Do not remove these fallbacks during CM-030. This inventory documents where the system simulates, degrades, or hides backend absence.

| Area | File(s) | Fallback type | Current behavior | SaaS risk | Required follow-up |
|---|---|---|---|---|---|
| Backend availability | `frontend/chatbot-v1.1-demo/app.js` | Hidden fallback | If Supabase client/config/public config is unavailable, chatbot sets `integrationMode = DEMO` and continues. | Users may think tickets are persisted. | CM-031 add explicit environment banner and real proof gate. |
| Incidence folios | `frontend/chatbot-v1.1-demo/app.js`, `frontend/shared/municipal-config.js` | Demo folio | Uses configured `REP-` prefix and local generated references instead of DB `public_id`. | Tracking format diverges from real UUID+secret. | CM-032 define canonical folio strategy. |
| Service folios | `frontend/chatbot-v1.1-demo/app.js`, `frontend/shared/municipal-config.js` | Demo folio | Uses `SOL-` prefix for service request simulations. | No backend SOL entity exists. | CM-033 implement real service request persistence or freeze copy. |
| Public content | `frontend/shared/municipal-config.js` | Demo/placeholder data | Authorities/council/economy/landmark fields include pending/demo placeholders. | Institutional misinformation if published as official. | CM-039 content workflow and validation. |
| GPS | `frontend/shared/municipal-config.js` | Demo GPS | Demo Laguna Salada coordinate is available for non-real flows. | Could be mistaken as citizen location. | CM-034 remove or gate demo GPS in production. |
| Evidence | `frontend/chatbot-v1.1-demo/app.js`, `v1.1/js/api.js` | Simulated/blocked upload | Validates file but does not upload citizen evidence; real path returns warning and creates ticket without evidence. | Evidence loss, false expectation. | CM-035 Edge Function/storage. |
| Costs | `frontend/shared/municipal-config.js`, `frontend/chatbot-v1.1-demo/app.js` | Demo pricing | Prices marked `demo` or pending are shown in service flow. | Legal/financial miscommunication. | CM-033 official tariff source. |
| Notifications | `frontend/shared/municipal-config.js`, `frontend/modules/notifications/index.js`, `frontend/modules/configuration/index.js` | Simulated notifications | Copy/templates and UI toggles exist; no send. | Operational teams may expect messages. | CM-041 real notification worker. |
| Impact metrics | `frontend/modules/municipal-panel/impact-data.js`, `impact-calculations.js` | Demo analytics | Impact center uses static/calculated demo data. | Misleading public performance metrics. | CM-038 metrics from real tickets. |
| Municipal panel | `frontend/modules/municipal-panel/index.js` | Demo operational UI | Shows cards/tabs without real workflow mutations. | Operators may trust non-persistent actions. | CM-037 real command center. |
| Brigade portal | `frontend/modules/brigade-portal/index.js` | Demo operational UI | Simulates brigade work state. | Field operations not actually recorded. | CM-036 real brigade workflow. |
| Configuration | `frontend/modules/configuration/index.js` | Simulated persistence | State changes live in JS object and confirmation dialogs only. | Admins may think settings changed. | CM-039 real settings CRUD. |
| Auth demos | `frontend/auth/demo.html`, `frontend/modules/authentication/index.js` | Simulated users | Demo login/roles are separate from Supabase Auth. | Role assumptions may bypass real authorization model. | CM-031/CM-039 auth proof. |
| Storage module | `frontend/modules/storage/*` | Demo storage | Module demonstrates storage concepts without bucket proof. | Bucket readiness overestimated. | CM-035 storage validation. |
| Error handling | `frontend/chatbot-v1.1-demo/app.js` | Error masking | Supabase public config errors are logged to console and flow continues. | Backend outages hidden from QA. | CM-031 fail-closed real mode. |

## Search evidence

Inventory was built using repository-wide searches for `demo`, `fallback`, `REP-`, `SOL-`, `localStorage`, `simulate`, `mock`, `notification`, `cost`, `impact`, `innerHTML`, `service_role`, `bucket`, `policy`, and Supabase references.
