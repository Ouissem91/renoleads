export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({ error: 'Missing env variables' });
  }

  const tables = [
    { name: 'Leads rénovation', type: 'lead' },
    { name: 'Rdv rénovation', type: 'rdv' }
  ];

  try {
    const results = await Promise.all(tables.map(async (t) => {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(t.name)}?pageSize=100&filterByFormula=Statut%3D'Disponible'`;
      const r = await fetch(url, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (!r.ok) throw new Error(`Airtable error ${r.status}`);
      const data = await r.json();
      return (data.records || []).map(rec => ({
        id: rec.id,
        type: t.type,
        ville: rec.fields['Ville'] || rec.fields['Name'] || '—',
        cp: rec.fields['Code postal'] || '—',
        prospect: rec.fields['Le prospect est :'] || rec.fields['Prospect'] || '—',
        concerne: rec.fields['Concerne :'] || rec.fields['Concerne'] || '—',
        travaux: rec.fields['Travaux à réaliser :'] || rec.fields['Travaux'] || '—',
        budget: rec.fields['Budget :'] || rec.fields['Budget'] || '—',
        delai: rec.fields['Souhaite réaliser les travaux dans :'] || rec.fields['Délai'] || '—',
        note: rec.fields['Note libre'] || '',
        prix: rec.fields['Prix'] || (t.type === 'rdv' ? 200 : 120),
        statut: rec.fields['Statut'] || 'Disponible',
        rdvDate: rec.fields['Date du RDV'] || rec.fields['Date RDV'] || ''
      }));
    }));

    const all = results.flat();
    res.status(200).json({ leads: all });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
