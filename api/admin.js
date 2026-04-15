export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({ error: 'Missing env variables' });
  }

  try {
    const results = await Promise.all([
      { name: 'Leads', type: 'lead' },
      { name: 'RDV', type: 'rdv' }
    ].map(async (t) => {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${t.name}?pageSize=100`;
      const r = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
      if (!r.ok) throw new Error(`Airtable error ${r.status}`);
      const data = await r.json();
      return (data.records || []).map(rec => ({
        id: rec.id,
        type: t.type,
        ville: rec.fields['Ville'] || rec.fields['Name'] || '—',
        cp: rec.fields['Code postal'] || '—',
        concerne: rec.fields['Concerne :'] || rec.fields['Concerne'] || '—',
        budget: rec.fields['Budget :'] || rec.fields['Budget'] || '—',
        prix: rec.fields['Prix'] || (t.type === 'rdv' ? 200 : 120),
        statut: rec.fields['Statut'] || 'Disponible'
      }));
    }));
    res.status(200).json({ leads: results.flat() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
