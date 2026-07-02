// Lightweight i18n: two locales, dot-path keys, {param} interpolation.
// Dutch is the default; the toggle lives in the sidebar footer.

export const LANGS = ['nl', 'en']
export const DEFAULT_LANG = 'nl'

export const MONTHS_SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  nl: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
}
export const MONTHS_LONG = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
}

// The API labels months in English ("Jan '25", "February 2026"); swap the
// tokens client-side so charts follow the UI language.
export function trMonths(label, lang) {
  if (lang === 'en' || !label) return label
  let out = label
  MONTHS_LONG.en.forEach((m, i) => {
    out = out.replace(m, MONTHS_LONG[lang][i])
  })
  MONTHS_SHORT.en.forEach((m, i) => {
    out = out.replace(new RegExp('\\b' + m + '\\b'), MONTHS_SHORT[lang][i])
  })
  return out
}

const DICT = {
  nl: {
    app: { checkingSession: 'Sessie controleren…', loading: 'Je omzetdata laden…', dismiss: 'Sluiten' },
    login: {
      email: 'E-mail', password: 'Wachtwoord', signIn: 'Inloggen', signingIn: 'Inloggen…',
      demo: 'Demo-account: {email} · {password}',
      name: 'Je naam', company: 'Bedrijfsnaam',
      createAccount: 'Account aanmaken', creating: 'Account aanmaken…',
      toRegister: 'Nog geen account? Registreer je bedrijf', toLogin: 'Al een account? Log in',
    },
    demo: {
      tryIt: 'Bekijk eerst de demo met voorbeelddata',
      banner: 'Je bekijkt de demo met voorbeelddata — kijk gerust rond, er kan niets stuk.',
      bannerCta: 'Maak gratis je eigen account',
      readOnly: 'In de demo kun je niets wijzigen. Maak gratis je eigen account om zelf klanten, abonnementen en plannen te beheren.',
    },
    onboarding: {
      welcome: 'Welkom, {name}!',
      body: 'Je omgeving voor {company} staat klaar, maar er is nog geen data. Voeg je eerste abonnement toe en zie je omzetstatistieken tot leven komen.',
    },
    nav: { dashboard: 'Dashboard', insights: 'Inzichten', customers: 'Klanten', plans: 'Plannen', subscriptions: 'Abonnementen', settings: 'Instellingen' },
    sidebar: { darkMode: 'Donkere modus', lightMode: 'Lichte modus', signOut: 'Uitloggen' },
    titles: {
      dashboard: ['Overzicht', 'Je terugkerende omzet in één oogopslag'],
      insights: ['Inzichten', 'Wat er veranderde, in gewone taal'],
      customers: ['Klanten', 'Accounts, plannen en betaalhistorie'],
      detail: ['Klant', 'Accountdetails'],
      plans: ['Plannen', 'Tiers, adoptie en omzetbijdrage'],
      subscriptions: ['Abonnementen', 'Beheer de abonnementslevenscyclus'],
      settings: ['Instellingen', 'Profiel, bedrijf en beveiliging'],
    },
    period: { this_month: 'Deze maand', last_month: 'Vorige maand', last_quarter: 'Afgelopen kwartaal', last_12: '12 maanden' },
    periodIn: { this_month: 'deze maand', last_month: 'vorige maand', last_quarter: 'het afgelopen kwartaal', last_12: 'de afgelopen 12 maanden' },
    newSub: 'Nieuw abonnement',
    dash: {
      layout: 'Indeling', revenueFirst: 'Omzet eerst', metricsFirst: 'Metrics eerst',
      mrr: 'MRR', mrrTip: 'Maandelijks terugkerende omzet — het vaste inkomen dat je elke maand van alle actieve abonnementen ontvangt.', mrrSub: 'Maandelijks terugkerende omzet',
      arr: 'ARR', arrTip: 'Jaarlijkse run-rate — je huidige maandomzet doorgerekend naar een heel jaar (MRR × 12).', arrSub: 'Jaarlijkse run-rate',
      activeCustomers: 'Actieve klanten', activeTip: 'Het aantal klanten met een betaald, actief abonnement op dit moment.', newThisPeriod: '{n} nieuw deze periode',
      netNewMrr: 'Netto nieuwe MRR', netTip: 'Hoeveel je maandomzet deze periode groeide of kromp: nieuw + upgrades − downgrades − opzeggingen.', netSub: 'Nieuw + upgrades − churn',
      trendTitle: 'Maandelijks terugkerende omzet', trendTip: 'Je totale maandelijks terugkerende omzet over de laatste 18 maanden. De gemarkeerde band is de gekozen periode.', trendSubtitle: 'Laatste 18 maanden · gekozen periode gemarkeerd',
      activeTitle: 'Actieve klanten', activeChartTip: 'Hoeveel betalende klanten je aan het einde van elke maand had, na aftrek van opzeggingen.', netOfChurn: 'Na aftrek van churn',
      perYear: '/ jr',
      movements: 'MRR-bewegingen', movementsTip: 'Waar je maandomzet deze periode groeide en kromp. Groene balken voegen omzet toe (nieuwe klanten, upgrades); rode halen het weg (downgrades, opzeggingen).', movementsSubtitle: 'Hoe je terugkerende omzet veranderde in {period}',
      chart: 'Grafiek', flow: 'Stroom', breakdown: 'Opsplitsing',
      newCustomers: 'Nieuwe klanten', upgrades: 'Upgrades', downgrades: 'Downgrades', cancellations: 'Opzeggingen',
      netChange: 'Netto MRR-verandering',
      nrr: 'Netto-omzetretentie', nrrTip: 'Van de omzet die je aan het begin had: hoeveel je behield en liet groeien — upgrades tellen mee, opzeggingen gaan eraf. Boven 100% besteden bestaande klanten steeds meer.', expanding: 'Groeiende basis', contracting: 'Krimpende basis',
      quick: 'Quick ratio', quickTip: 'Groei-efficiëntie: gewonnen omzet (nieuw + upgrades) gedeeld door verloren omzet (downgrades + opzeggingen). Hoger is gezonder; boven 4 is sterk. ∞ betekent dat er deze periode niets verloren ging.', quickHint: '(Nieuw+Upgr.) / (Downgr.+Churn)',
      arpu: 'ARPU', arpuTip: 'Gemiddelde omzet per gebruiker — totale maandomzet gedeeld door je actieve klanten.', arpuHint: 'Per actieve klant',
      ltv: 'LTV', ltvTip: 'Lifetime Value — de geschatte totale omzet van een klant vóór opzegging (ARPU ÷ maandelijkse churn).', ltvHint: 'ARPU ÷ maandelijkse churn',
      custChurn: 'Klantchurn', custChurnTip: 'Het aandeel klanten dat gemiddeld per maand opzegt. Lager is beter.', perMonth: 'gem. / maand',
      revChurn: 'Omzetchurn', revChurnTip: 'Het aandeel maandomzet dat gemiddeld per maand verloren gaat aan opzeggingen. Lager is beter.',
      activeTooltip: 'actieve klanten',
    },
    cohort: {
      title: 'Cohortretentie', tip: 'Groepeer klanten op de maand van aanmelding en volg per maand daarna welk deel nog actief is. Lees elke rij van links naar rechts — meestal vervaagt hij in de tijd.',
      subtitle: '% van elk aanmeldcohort dat nog actief is, per maand sinds aanmelding',
      cohortCol: 'Cohort', size: 'Omvang', fewer: 'Minder nog actief', more: 'Meer nog actief',
    },
    flow: { net: 'Netto' },
    insights: {
      healthy: 'Gezonde groei', attention: 'Vraagt aandacht',
      heroLabel: 'netto nieuwe MRR in {period}',
      heroBody: '{n} nieuwe klanten plus upgrades voegden {added} toe, terwijl downgrades en opzeggingen {removed} weghaalden. Je eindigde op {mrr} maandelijks terugkerende omzet.',
      chipGains: 'Nieuw + upgrades', chipLosses: 'Downgrades + opzeggingen', chipNrr: 'Netto-omzetretentie', chipActive: 'Actieve klanten',
      growingTitle: 'De omzet groeit', shrinkingTitle: 'De omzet krimpt',
      growingBody: 'In {period} klom je maandomzet naar {mrr} — het inkomen waar je elke maand op kunt rekenen.',
      shrinkingBody: 'In {period} daalde je maandomzet naar {mrr} — het inkomen waar je elke maand op kunt rekenen.',
      newTitle: 'Nieuwe klanten stuwen de groei', newBody: '{n} nieuwe klanten meldden zich deze periode aan, goed voor {amt} aan gloednieuwe maandomzet.',
      upgradeTitle: 'Klanten upgraden', upgradeBody: 'Bestaande klanten die naar grotere plannen overstapten voegden {amt} per maand toe — groei zonder één nieuwe aanmelding.',
      cancelTitle: 'Opzeggingen om te volgen', cancelBody: '{n} klanten zegden op en namen {amt} maandomzet mee. Gemiddeld vertrekt zo’n {pct} van de klanten per maand.',
      nrrGoodTitle: 'Je behoudt meer dan je verliest', nrrBadTitle: 'Bestaande omzet glijdt weg',
      nrrGoodBody: 'De netto-omzetretentie is {pct}. Zelfs zonder nieuwe klanten zou de omzet nog groeien, omdat upgrades zwaarder wegen dan opzeggingen.',
      nrrBadBody: 'De netto-omzetretentie is {pct} — upgrades dekken de downgrades en opzeggingen van bestaande klanten nog niet.',
      topPlanTitle: '{plan} brengt het meest op', topPlanBody: 'Je {plan}-plan is de grootste bron van omzet — {n} klanten betalen samen {amt} per maand.',
      last12: 'Laatste 12 maanden',
    },
    customers: {
      active: 'Actieve klanten', activeSub: 'betalen op dit moment',
      churned: 'Gechurnd', churnedSub: 'opgezegd tot nu toe',
      newPeriod: 'Nieuw deze periode', newPeriodSub: 'aangemeld in {period}',
      totalMrr: 'Totale MRR', totalMrrSub: 'uit actieve abonnementen',
      search: 'Zoek klanten…', all: 'Alle', activeChip: 'Actief', churnedChip: 'Gechurnd',
      colCustomer: 'Klant', colPlan: 'Plan', colMrr: 'MRR', colCountry: 'Land', colStatus: 'Status', colSignup: 'Aangemeld',
      openCustomer: 'Open klant {name}',
      statusActive: 'Actief', statusChurned: 'Gechurnd',
      showing: '{x} van {y} klanten weergegeven', page: 'Pagina {x} van {y}', prev: '← Vorige', next: 'Volgende →',
    },
    detail: {
      back: 'Alle klanten', loading: 'Klant laden…',
      changePlan: 'Plan wijzigen', cancel: 'Opzeggen', reactivate: 'Heractiveren',
      currentPlan: 'Huidig plan', currentMrr: 'Huidige MRR', lifetimePaid: 'Totaal betaald', since: 'Klant sinds',
      timeline: 'Abonnementstijdlijn',
      evNew: 'Geabonneerd', evExpansion: 'Geüpgraded', evContraction: 'Gedowngraded', evChurn: 'Opgezegd',
      planSuffix: '{plan}-plan',
      payments: 'Betaalhistorie', paidSummary: '{n} betaald · {amt}',
      paid: 'Betaald', refunded: 'Terugbetaald', failed: 'Mislukt', retry: 'nieuwe poging',
    },
    subs: {
      active: 'Actieve abonnementen', activeSub: 'wordt nu gefactureerd',
      totalMrr: 'Totale MRR', totalMrrSub: 'terugkerend per maand',
      avgMrr: 'Gemiddelde MRR', avgMrrSub: 'per abonnement',
      annual: 'Jaarlijkse facturatie', annualSub: 'jaarlijks vooruitbetaald',
      allPlans: 'Alle plannen',
      colCustomer: 'Klant', colPlan: 'Plan', colMrr: 'MRR', colStarted: 'Gestart', colActions: 'Acties',
      yearly: 'Jaarlijks', monthly: 'Maandelijks',
      change: 'Wijzig', cancel: 'Opzeggen',
      showing: '{x} van {y} actieve abonnementen weergegeven',
    },
    plans: {
      popular: 'Populairst', perMo: '/mnd', perYr: '/jr',
      billedMonthly: 'maandelijks gefactureerd', recognized: '{mrr}/mnd geboekt als MRR',
      customers: 'klanten', mrr: 'MRR', share: 'Aandeel in omzet', shareOf: 'aandeel in omzet van {plan}',
      contribution: 'Omzetbijdrage per plan', contributionSub: 'Hoe elke tier bijdraagt aan {total} MRR',
      tierRow: '{n} klanten · {pct}',
      newPlan: 'Nieuw plan', editPlan: 'Plan bewerken',
      planName: 'Naam', planBlurb: 'Omschrijving (optioneel)', planPrice: 'Prijs ($)',
      intervalLabel: 'Facturatie', monthly: 'Maandelijks', yearly: 'Jaarlijks (prijs per jaar)',
      createPlan: 'Plan aanmaken', savePlan: 'Opslaan',
      deleteTitle: 'Plan verwijderen', deleteBody: 'Weet je zeker dat je het plan “{plan}” wilt verwijderen?', deleteConfirm: 'Verwijderen',
      inUse: 'Dit plan is (ooit) in gebruik geweest en kan niet worden verwijderd.',
      editAria: 'Bewerk plan {plan}', deleteAria: 'Verwijder plan {plan}',
    },
    modal: {
      changeTitle: 'Plan wijzigen', selectNew: 'Kies een nieuw plan', choose: 'Kies een plan', update: 'Plan bijwerken',
      cancelTitle: 'Abonnement opzeggen', confirmCancel: 'Opzegging bevestigen',
      cancelBody: 'Hiermee wordt het abonnement van {name} per deze maand opgezegd. Hun {mrr} MRR verschuift naar churn en verlaagt de netto nieuwe MRR voor de huidige periode.',
      thisCustomer: 'deze klant',
      newTitle: 'Nieuw abonnement', newSub: 'Voeg een klant toe en start facturatie', create: 'Abonnement aanmaken',
      companyName: 'Bedrijfsnaam', close: 'Annuleren', working: 'Bezig…',
      customerEmail: 'E-mailadres (optioneel)', country: 'Land',
      moPrice: '{price}/mnd', yrPrice: '{price}/jr · {mrr} MRR',
    },
    settings: {
      profileTitle: 'Profiel', profileSub: 'Je naam en e-mailadres (ook je inlognaam)',
      name: 'Naam', email: 'E-mail',
      companyTitle: 'Bedrijf', companySub: 'De bedrijfsnaam in de zijbalk en je omgeving',
      company: 'Bedrijfsnaam',
      passwordTitle: 'Wachtwoord wijzigen', passwordSub: 'Andere ingelogde sessies worden hierbij uitgelogd',
      currentPassword: 'Huidig wachtwoord', newPassword: 'Nieuw wachtwoord', confirmPassword: 'Bevestig nieuw wachtwoord',
      save: 'Opslaan', saving: 'Opslaan…', saved: 'Opgeslagen ✓',
      changePassword: 'Wachtwoord wijzigen', passwordChanged: 'Wachtwoord gewijzigd ✓',
    },
    infoTip: 'Meer info: ',
  },
  en: {
    app: { checkingSession: 'Checking session…', loading: 'Loading your revenue data…', dismiss: 'Dismiss' },
    login: {
      email: 'Email', password: 'Password', signIn: 'Sign in', signingIn: 'Signing in…',
      demo: 'Demo account: {email} · {password}',
      name: 'Your name', company: 'Company name',
      createAccount: 'Create account', creating: 'Creating account…',
      toRegister: 'No account yet? Register your company', toLogin: 'Already have an account? Sign in',
    },
    demo: {
      tryIt: 'Explore the demo with sample data first',
      banner: 'You are viewing the demo with sample data — look around, nothing can break.',
      bannerCta: 'Create your free account',
      readOnly: 'The demo is read-only. Create your free account to manage your own customers, subscriptions and plans.',
    },
    onboarding: {
      welcome: 'Welcome, {name}!',
      body: 'Your workspace for {company} is ready, but there is no data yet. Add your first subscription and watch your revenue metrics come to life.',
    },
    nav: { dashboard: 'Dashboard', insights: 'Insights', customers: 'Customers', plans: 'Plans', subscriptions: 'Subscriptions', settings: 'Settings' },
    sidebar: { darkMode: 'Dark mode', lightMode: 'Light mode', signOut: 'Sign out' },
    titles: {
      dashboard: ['Overview', 'Your recurring revenue at a glance'],
      insights: ['Insights', 'A plain-language summary of what changed'],
      customers: ['Customers', 'Accounts, plans and payment history'],
      detail: ['Customer', 'Account detail'],
      plans: ['Plans', 'Tiers, adoption and revenue contribution'],
      subscriptions: ['Subscriptions', 'Manage the subscription lifecycle'],
      settings: ['Settings', 'Profile, company and security'],
    },
    period: { this_month: 'This month', last_month: 'Last month', last_quarter: 'Last quarter', last_12: '12 months' },
    periodIn: { this_month: 'this month', last_month: 'last month', last_quarter: 'the last quarter', last_12: 'the last 12 months' },
    newSub: 'New subscription',
    dash: {
      layout: 'Layout', revenueFirst: 'Revenue-first', metricsFirst: 'Metrics-first',
      mrr: 'MRR', mrrTip: 'Monthly Recurring Revenue — the steady income you collect every month from all active subscriptions.', mrrSub: 'Monthly recurring revenue',
      arr: 'ARR', arrTip: 'Annual Run-Rate — your current monthly revenue projected across a full year (MRR × 12).', arrSub: 'Annual run-rate',
      activeCustomers: 'Active customers', activeTip: 'The number of customers with a paid, active subscription right now.', newThisPeriod: '{n} new this period',
      netNewMrr: 'Net new MRR', netTip: 'How much your monthly revenue grew or shrank this period: new + upgrades − downgrades − cancellations.', netSub: 'New + expansion − churn',
      trendTitle: 'Monthly recurring revenue', trendTip: 'Your total monthly recurring revenue over the last 18 months. The shaded band marks the period you picked at the top.', trendSubtitle: 'Last 18 months · selected period shaded',
      activeTitle: 'Active customers', activeChartTip: 'How many paying customers you had at the end of each month, after subtracting anyone who cancelled.', netOfChurn: 'Net of churn',
      perYear: '/ yr',
      movements: 'MRR movements', movementsTip: 'Where your monthly revenue grew and shrank this period. Green bars add revenue (new customers, upgrades); red bars remove it (downgrades, cancellations).', movementsSubtitle: 'How recurring revenue changed over {period}',
      chart: 'Chart', flow: 'Flow', breakdown: 'Breakdown',
      newCustomers: 'New customers', upgrades: 'Upgrades', downgrades: 'Downgrades', cancellations: 'Cancellations',
      netChange: 'Net MRR change',
      nrr: 'Net revenue retention', nrrTip: 'Of the revenue you had at the start, how much you kept and grew — counting upgrades, losing cancellations. Above 100% means existing customers spend more over time.', expanding: 'Expanding base', contracting: 'Contracting base',
      quick: 'Quick ratio', quickTip: 'Growth efficiency: revenue gained (new + upgrades) divided by revenue lost (downgrades + cancellations). Higher is healthier; above 4 is strong. ∞ means nothing was lost this period.', quickHint: '(New+Exp) / (Contr+Churn)',
      arpu: 'ARPU', arpuTip: 'Average Revenue Per User — total monthly revenue divided by your active customers.', arpuHint: 'Per active customer',
      ltv: 'LTV', ltvTip: 'Lifetime Value — the estimated total revenue from a customer before they cancel (ARPU ÷ monthly churn rate).', ltvHint: 'ARPU ÷ monthly churn',
      custChurn: 'Customer churn', custChurnTip: 'The share of customers who cancel each month, on average. Lower is better.', perMonth: 'avg / month',
      revChurn: 'Revenue churn', revChurnTip: 'The share of monthly revenue lost to cancellations each month, on average. Lower is better.',
      activeTooltip: 'active customers',
    },
    cohort: {
      title: 'Cohort retention', tip: 'Group customers by the month they signed up, then track the share still active each month after. Read each row left to right — it usually fades over time.',
      subtitle: '% of each signup cohort still active, by months since signup',
      cohortCol: 'Cohort', size: 'Size', fewer: 'Fewer still active', more: 'More still active',
    },
    flow: { net: 'Net' },
    insights: {
      healthy: 'Healthy growth', attention: 'Needs attention',
      heroLabel: 'net new MRR over {period}',
      heroBody: '{n} new customers plus upgrades added {added}, while downgrades and cancellations removed {removed}. You ended at {mrr} in monthly recurring revenue.',
      chipGains: 'New + upgrades', chipLosses: 'Downgrades + cancels', chipNrr: 'Net revenue retention', chipActive: 'Active customers',
      growingTitle: 'Revenue is growing', shrinkingTitle: 'Revenue is shrinking',
      growingBody: 'Over {period}, your monthly revenue climbed to {mrr} — the income you can count on every month.',
      shrinkingBody: 'Over {period}, your monthly revenue dropped to {mrr} — the income you can count on every month.',
      newTitle: 'New customers fuel growth', newBody: '{n} new customers signed up this period, adding {amt} in brand-new monthly revenue.',
      upgradeTitle: 'Customers are upgrading', upgradeBody: 'Existing customers moving up to bigger plans added {amt} more per month — growth without a single new sign-up.',
      cancelTitle: 'Cancellations to watch', cancelBody: '{n} customers cancelled, taking {amt} of monthly revenue with them. On average about {pct} of customers leave each month.',
      nrrGoodTitle: 'You keep more than you lose', nrrBadTitle: 'Existing revenue is slipping',
      nrrGoodBody: 'Net revenue retention is {pct}. Even with zero new customers, revenue would still grow because upgrades outweigh cancellations.',
      nrrBadBody: 'Net revenue retention is {pct} — upgrades are not yet covering downgrades and cancellations from existing customers.',
      topPlanTitle: '{plan} brings in the most', topPlanBody: 'Your {plan} plan is the biggest slice of revenue — {n} customers paying {amt} a month in total.',
      last12: 'Last 12 months',
    },
    customers: {
      active: 'Active customers', activeSub: 'paying right now',
      churned: 'Churned', churnedSub: 'cancelled to date',
      newPeriod: 'New this period', newPeriodSub: 'signed up in {period}',
      totalMrr: 'Total MRR', totalMrrSub: 'from active subscriptions',
      search: 'Search customers…', all: 'All', activeChip: 'Active', churnedChip: 'Churned',
      colCustomer: 'Customer', colPlan: 'Plan', colMrr: 'MRR', colCountry: 'Country', colStatus: 'Status', colSignup: 'Signed up',
      openCustomer: 'Open customer {name}',
      statusActive: 'Active', statusChurned: 'Churned',
      showing: 'Showing {x} of {y} customers', page: 'Page {x} of {y}', prev: '← Prev', next: 'Next →',
    },
    detail: {
      back: 'All customers', loading: 'Loading customer…',
      changePlan: 'Change plan', cancel: 'Cancel', reactivate: 'Reactivate',
      currentPlan: 'Current plan', currentMrr: 'Current MRR', lifetimePaid: 'Lifetime paid', since: 'Customer since',
      timeline: 'Subscription timeline',
      evNew: 'Subscribed', evExpansion: 'Upgraded', evContraction: 'Downgraded', evChurn: 'Canceled',
      planSuffix: '{plan} plan',
      payments: 'Payment history', paidSummary: '{n} paid · {amt}',
      paid: 'Paid', refunded: 'Refunded', failed: 'Failed', retry: 'retry',
    },
    subs: {
      active: 'Active subscriptions', activeSub: 'currently billing',
      totalMrr: 'Total MRR', totalMrrSub: 'recurring per month',
      avgMrr: 'Average MRR', avgMrrSub: 'per subscription',
      annual: 'On annual billing', annualSub: 'paid yearly upfront',
      allPlans: 'All plans',
      colCustomer: 'Customer', colPlan: 'Plan', colMrr: 'MRR', colStarted: 'Started', colActions: 'Actions',
      yearly: 'Annual', monthly: 'Monthly',
      change: 'Change', cancel: 'Cancel',
      showing: 'Showing {x} of {y} active subscriptions',
    },
    plans: {
      popular: 'Most popular', perMo: '/mo', perYr: '/yr',
      billedMonthly: 'billed monthly', recognized: '{mrr}/mo recognized',
      customers: 'customers', mrr: 'MRR', share: 'Share of revenue', shareOf: '{plan} share of revenue',
      contribution: 'Revenue contribution by plan', contributionSub: 'How each tier contributes to {total} MRR',
      tierRow: '{n} customers · {pct}',
      newPlan: 'New plan', editPlan: 'Edit plan',
      planName: 'Name', planBlurb: 'Description (optional)', planPrice: 'Price ($)',
      intervalLabel: 'Billing', monthly: 'Monthly', yearly: 'Yearly (price per year)',
      createPlan: 'Create plan', savePlan: 'Save',
      deleteTitle: 'Delete plan', deleteBody: 'Are you sure you want to delete the “{plan}” plan?', deleteConfirm: 'Delete',
      inUse: 'This plan is (or has been) in use and cannot be deleted.',
      editAria: 'Edit plan {plan}', deleteAria: 'Delete plan {plan}',
    },
    modal: {
      changeTitle: 'Change plan', selectNew: 'Select a new plan', choose: 'Choose a plan', update: 'Update plan',
      cancelTitle: 'Cancel subscription', confirmCancel: 'Confirm cancellation',
      cancelBody: 'This will cancel {name}’s subscription effective this month. Their {mrr} MRR will move to churned, lowering net new MRR for the current period.',
      thisCustomer: 'this customer',
      newTitle: 'New subscription', newSub: 'Add a customer and start billing', create: 'Create subscription',
      companyName: 'Company name', close: 'Cancel', working: 'Working…',
      customerEmail: 'Email address (optional)', country: 'Country',
      moPrice: '{price}/mo', yrPrice: '{price}/yr · {mrr} MRR',
    },
    settings: {
      profileTitle: 'Profile', profileSub: 'Your name and email address (also your login)',
      name: 'Name', email: 'Email',
      companyTitle: 'Company', companySub: 'The company name in the sidebar and your workspace',
      company: 'Company name',
      passwordTitle: 'Change password', passwordSub: 'Other signed-in sessions will be logged out',
      currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm new password',
      save: 'Save', saving: 'Saving…', saved: 'Saved ✓',
      changePassword: 'Change password', passwordChanged: 'Password changed ✓',
    },
    infoTip: 'More info: ',
  },
}

/** Translate known API error markers; fall back to the raw message. */
export function apiErrorText(err, t) {
  const msg = err?.message ?? err
  if (msg === 'demo_read_only') return t('demo.readOnly')
  if (msg === 'plan_in_use') return t('plans.inUse')
  return msg
}

function resolve(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

// makeT('nl') → t('customers.showing', {x: 40, y: 212})
export function makeT(lang) {
  const dict = DICT[lang] || DICT[DEFAULT_LANG]
  return (key, params) => {
    let value = resolve(dict, key) ?? resolve(DICT.en, key) ?? key
    if (typeof value === 'string' && params) {
      for (const [k, v] of Object.entries(params)) value = value.replaceAll('{' + k + '}', String(v))
    }
    return value
  }
}
