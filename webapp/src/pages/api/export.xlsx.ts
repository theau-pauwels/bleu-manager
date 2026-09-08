import type { APIRoute } from 'astro';
import ExcelJS from 'exceljs';
import { currentUser } from '@lib/auth';
import { query } from '@lib/db';

export const GET: APIRoute = async ({ cookies }) => {
  if (!(await currentUser(cookies))) return new Response(null, { status: 401 });
  const rows = await query<any[]>('SELECT * FROM bleus ORDER BY Nom, Prenom');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bleu Manager';
  const sheet = workbook.addWorksheet('Bleus', { views: [{ state: 'frozen', ySplit: 1 }] });
  const keys = rows.length ? Object.keys(rows[0]) : ['id','Nom','Prenom','Sexe','DateN','Adresse','Med','Com','Tel','Regio','Supp','RespLegal','NumRespLegal','Ramassage1','Ramassage2','Ramassage3','Ramassage4'];
  sheet.columns = keys.map((key) => ({ header: key, key, width: Math.min(Math.max(key.length + 2, 14), 35) }));
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: 'A1', to: sheet.getRow(1).getCell(keys.length).address };
  const data = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(data as ArrayBuffer, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="bleu-manager-${date}.xlsx"`,
      'cache-control': 'no-store'
    }
  });
};
