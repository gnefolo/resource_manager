# Resource Manager - TODO

## Import e Setup Dati
- [x] Import automatico dati da file Excel con parsing delle 7 commesse esistenti
- [x] Parsing di progetti, clienti, risorse, budget, margini, scadenze dal file Excel

## Dashboard e KPI
- [x] Dashboard KPI con visualizzazione marginalità per ogni commessa
- [x] Visualizzazione budget residuo per commessa
- [x] Visualizzazione spesa mensile massima sostenibile
- [x] Visualizzazione avanzamento tecnico per ogni commessa
- [x] Grafici e visualizzazioni per analisi rapida

## Gestione Risorse
- [x] Visualizzazione allocazione ore/giorni mensili per persona su ogni commessa
- [x] Visualizzazione costi giornalieri e mensili per risorsa
- [ ] Interfaccia per aggiungere nuove risorse al team
- [x] Gestione costo giornaliero e disponibilità risorse
- [ ] Sistema di riallocazione risorse tra commesse

## Tracking e Monitoraggio
- [ ] Sistema di tracking ore effettive vs pianificate
- [ ] Calcolo scostamenti budget/ore
- [ ] Alert per superamento budget
- [ ] Notifiche per scadenze a rischio

## Gestione Commesse
- [ ] Interfaccia per aggiungere nuove commesse manualmente
- [ ] Form con tutti i campi necessari (nome, cliente, valore, margine, budget, scadenze)
- [ ] Modifica commesse esistenti
- [x] Eliminazione commesse

## Calendario e Scadenze
- [ ] Calendario commesse con visualizzazione scadenze
- [ ] Visualizzazione mesi residui di attività
- [ ] Sistema di notifiche per scadenze imminenti

## Reportistica
- [ ] Export dati in formato Excel/CSV
- [ ] Grafici per analisi marginalità
- [ ] Grafici per utilizzo risorse
- [ ] Report personalizzabili

## Autenticazione e Sicurezza
- [x] Autenticazione manager con accesso esclusivo
- [x] Protezione dati commesse
- [x] Controllo accessi alle funzionalità

## Testing e Deployment
- [x] Test unitari per funzionalità critiche
- [x] Test integrazione import Excel
- [ ] Checkpoint finale

## Interfaccia Drag-and-Drop per Riallocazione Risorse
- [x] Installare libreria @dnd-kit per drag-and-drop
- [x] Creare API backend per riallocare risorse tra commesse
- [x] Implementare vista a colonne con commesse e risorse allocate
- [x] Aggiungere funzionalità drag-and-drop tra commesse
- [x] Calcolo automatico costi dopo riallocazione
- [x] Validazione disponibilità risorse prima di riallocare
- [x] Feedback visuale durante il drag
- [x] Aggiornamento ottimistico dell'UI

## Vista Calendario Risorse
- [x] Estendere schema database per allocazioni giornaliere
- [x] Creare API backend per recuperare allocazioni per mese/risorsa
- [x] Implementare componente calendario con date-fns
- [x] Codifica a colori per distinguere commesse diverse
- [x] Visualizzazione tooltip con dettagli allocazione al hover
- [x] Filtro per risorsa specifica
- [x] Navigazione tra mesi
- [x] Legenda colori commesse
- [x] Indicatori per giorni con allocazioni

## Funzionalità "In Arrivo" da Implementare
- [ ] Form creazione nuova commessa con tutti i campi
- [ ] Form modifica commessa esistente
- [ ] Form creazione nuova risorsa
- [ ] Form modifica risorsa esistente
- [ ] Form registrazione ore nel time tracking
- [ ] Visualizzazione dettagli progetto al click nella pagina time tracking
