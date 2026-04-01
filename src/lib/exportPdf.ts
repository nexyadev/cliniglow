import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

const VIOLET = [124, 92, 252] as const;
const VIOLET_LIGHT = [248, 247, 255] as const;
const DARK = [15, 15, 20] as const;
const GRAY = [120, 120, 135] as const;

function drawHeader(doc: jsPDF, clinicName: string) {
  doc.setFillColor(...VIOLET);
  doc.rect(0, 0, 210, 38, "F");

  doc.setFillColor(255, 255, 255, 0.08);
  doc.circle(180, 10, 30, "F");
  doc.circle(195, 35, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CliniGlow", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(clinicName, 14, 24);

  doc.setFontSize(9);
  doc.text("Relatório Completo de Dados", 14, 31);

  const now = new Date();
  doc.text(
    `${now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    196, 31, { align: "right" }
  );

  doc.setTextColor(...DARK);
}

function drawSectionTitle(doc: jsPDF, y: number, title: string, count?: number): number {
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFillColor(...VIOLET);
  doc.roundedRect(14, y - 5, 3, 14, 1.5, 1.5, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(title, 21, y + 4);

  if (count !== undefined) {
    const titleWidth = doc.getTextWidth(title);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(`(${count} ${count === 1 ? "registro" : "registros"})`, 21 + titleWidth + 3, y + 4);
  }

  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  return y + 14;
}

function drawInfoBox(doc: jsPDF, y: number, items: { label: string; value: string; color?: readonly number[] }[]): number {
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFillColor(248, 247, 255);
  doc.roundedRect(14, y - 2, 182, 18, 3, 3, "F");

  const boxWidth = 182 / items.length;
  items.forEach((item, i) => {
    const x = 14 + (boxWidth * i) + (boxWidth / 2);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(item.label, x, y + 4, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(item.color || DARK));
    doc.text(item.value, x, y + 12, { align: "center" });
  });

  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  return y + 24;
}

function drawEmptyState(doc: jsPDF, y: number, msg: string): number {
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(msg, 21, y);
  doc.setTextColor(...DARK);
  return y + 10;
}

function drawTable(doc: jsPDF, y: number, head: string[][], body: any[][]): number {
  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK as unknown as number[], lineColor: [230, 230, 235] },
    headStyles: { fillColor: VIOLET as unknown as number[], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: VIOLET_LIGHT as unknown as number[] },
    margin: { left: 14, right: 14 },
    tableLineWidth: 0,
    tableLineColor: [230, 230, 235],
  });
  return (doc as any).lastAutoTable.finalY + 12;
}

function drawFooter(doc: jsPDF, clinicName: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(230, 230, 235);
    doc.line(14, 284, 196, 284);

    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`CliniGlow  |  ${clinicName}`, 14, 289);
    doc.text(`Página ${i} de ${pageCount}`, 196, 289, { align: "right" });

    doc.setFontSize(6);
    doc.text("Documento gerado automaticamente. Dados confidenciais.", 105, 293, { align: "center" });
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatMoney(v: number | string | null) {
  if (v === null || v === undefined) return "R$ 0,00";
  return `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function translateStatus(s: string | null) {
  const map: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
    pending: "Pendente",
  };
  return map[s || ""] || s || "—";
}

export async function exportClinicPdf(clinicId: string, clinicName: string) {
  const doc = new jsPDF();

  const [
    { data: clients },
    { data: appointments },
    { data: procedures },
    { data: professionals },
    { data: products },
    { data: sessions },
    { data: financials },
    { data: clinicInfo },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("clinic_id", clinicId).order("name"),
    supabase.from("appointments").select("*, clients(name), procedures(name, price), professionals(name)").eq("clinic_id", clinicId).order("date", { ascending: false }).limit(500),
    supabase.from("procedures").select("*").eq("clinic_id", clinicId).order("name"),
    supabase.from("professionals").select("*").eq("clinic_id", clinicId).order("name"),
    supabase.from("products").select("*").eq("clinic_id", clinicId).order("name"),
    supabase.from("sessions").select("*, clients(name), procedures(name)").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(500),
    supabase.from("financial_records").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
    supabase.from("clinics").select("name, subscription_status, created_at").eq("id", clinicId).single(),
  ]);

  drawHeader(doc, clinicName);

  const totalIncome = (financials || []).filter(f => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const totalExpense = (financials || []).filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const profit = totalIncome - totalExpense;
  const totalProducts = (products || []).reduce((s, p) => s + Number(p.quantity || 0), 0);

  let y = 48;

  y = drawInfoBox(doc, y, [
    { label: "CLIENTES", value: String((clients || []).length) },
    { label: "PROCEDIMENTOS", value: String((procedures || []).length) },
    { label: "PROFISSIONAIS", value: String((professionals || []).length) },
    { label: "RECEITA TOTAL", value: formatMoney(totalIncome), color: [16, 185, 129] as const },
    { label: "LUCRO", value: formatMoney(profit), color: profit >= 0 ? [16, 185, 129] as const : [239, 68, 68] as const },
  ]);

  y = drawSectionTitle(doc, y, "Clientes", (clients || []).length);
  if (clients && clients.length > 0) {
    y = drawTable(doc, y,
      [["Nome", "Telefone", "E-mail", "Nascimento", "Cadastro"]],
      clients.map(c => [c.name, c.phone || "—", c.email || "—", formatDate(c.birth_date), formatDate(c.created_at)])
    );
  } else {
    y = drawEmptyState(doc, y, "Nenhum cliente cadastrado.");
  }

  y = drawSectionTitle(doc, y, "Procedimentos", (procedures || []).length);
  if (procedures && procedures.length > 0) {
    y = drawTable(doc, y,
      [["Nome", "Preço", "Duração (min)", "Comissão (%)", "Total Agend."]],
      procedures.map(p => {
        const agendCount = (appointments || []).filter((a: any) => a.procedures?.name === p.name).length;
        return [p.name, formatMoney(p.price), String(p.duration), `${p.commission || 0}%`, String(agendCount)];
      })
    );
  } else {
    y = drawEmptyState(doc, y, "Nenhum procedimento cadastrado.");
  }

  y = drawSectionTitle(doc, y, "Profissionais", (professionals || []).length);
  if (professionals && professionals.length > 0) {
    y = drawTable(doc, y,
      [["Nome", "Especialidade", "Telefone", "E-mail"]],
      professionals.map(p => [p.name, p.specialty || "—", p.phone || "—", p.email || "—"])
    );
  } else {
    y = drawEmptyState(doc, y, "Nenhum profissional cadastrado.");
  }

  y = drawSectionTitle(doc, y, "Estoque", (products || []).length);
  if (products && products.length > 0) {
    y = drawInfoBox(doc, y, [
      { label: "TOTAL DE ITENS", value: String(totalProducts) },
      { label: "VALOR EM ESTOQUE", value: formatMoney((products || []).reduce((s, p) => s + (Number(p.price) * Number(p.quantity || 0)), 0)) },
      { label: "PRODUTOS COM ESTOQUE BAIXO", value: String((products || []).filter(p => p.quantity <= (p.min_quantity || 5)).length), color: [239, 68, 68] as const },
    ]);
    y = drawTable(doc, y,
      [["Produto", "Preço Unit.", "Quantidade", "Mín. Alerta", "Valor Total"]],
      products.map(p => [
        p.name,
        formatMoney(p.price),
        String(p.quantity),
        String(p.min_quantity || 5),
        formatMoney(Number(p.price) * Number(p.quantity || 0)),
      ])
    );
  } else {
    y = drawEmptyState(doc, y, "Nenhum produto cadastrado.");
  }

  y = drawSectionTitle(doc, y, "Resumo Financeiro", (financials || []).length);
  y = drawInfoBox(doc, y, [
    { label: "RECEITAS", value: formatMoney(totalIncome), color: [16, 185, 129] as const },
    { label: "DESPESAS", value: formatMoney(totalExpense), color: [239, 68, 68] as const },
    { label: "LUCRO LÍQUIDO", value: formatMoney(profit), color: profit >= 0 ? [16, 185, 129] as const : [239, 68, 68] as const },
  ]);
  if (financials && financials.length > 0) {
    y = drawTable(doc, y,
      [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
      financials.map(f => [
        formatDate(f.created_at),
        f.description || "—",
        f.category || "—",
        f.type === "income" ? "Receita" : "Despesa",
        formatMoney(f.amount),
      ])
    );
  }

  y = drawSectionTitle(doc, y, "Agendamentos", (appointments || []).length);
  if (appointments && appointments.length > 0) {
    const completed = (appointments || []).filter(a => a.status === "completed").length;
    const cancelled = (appointments || []).filter(a => a.status === "cancelled").length;
    const revenue = (appointments || []).filter(a => a.status === "completed").reduce((s, a: any) => s + (Number(a.procedures?.price) || 0), 0);
    y = drawInfoBox(doc, y, [
      { label: "TOTAL", value: String((appointments || []).length) },
      { label: "CONCLUÍDOS", value: String(completed), color: [16, 185, 129] as const },
      { label: "CANCELADOS", value: String(cancelled), color: [239, 68, 68] as const },
      { label: "RECEITA ESTIMADA", value: formatMoney(revenue) },
    ]);
    y = drawTable(doc, y,
      [["Data", "Horário", "Cliente", "Procedimento", "Profissional", "Status"]],
      (appointments || []).slice(0, 300).map(a => [
        formatDate(a.date),
        a.date ? new Date(a.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—",
        (a as any).clients?.name || "—",
        (a as any).procedures?.name || "—",
        (a as any).professionals?.name || "—",
        translateStatus(a.status),
      ])
    );
  } else {
    y = drawEmptyState(doc, y, "Nenhum agendamento registrado.");
  }

  y = drawSectionTitle(doc, y, "Sessões de Tratamento", (sessions || []).length);
  if (sessions && sessions.length > 0) {
    y = drawTable(doc, y,
      [["Data", "Cliente", "Procedimento", "Sessão #", "Status"]],
      (sessions || []).slice(0, 300).map(s => [
        formatDate(s.created_at),
        (s as any).clients?.name || "—",
        (s as any).procedures?.name || "—",
        `#${s.session_number}`,
        translateStatus(s.status),
      ])
    );
  } else {
    y = drawEmptyState(doc, y, "Nenhuma sessão registrada.");
  }

  drawFooter(doc, clinicName);

  doc.save(`${clinicName.replace(/\s+/g, "_")}_relatorio_completo.pdf`);
}

export async function exportClinicPdfByAdmin(clinicId: string, clinicName: string) {
  return exportClinicPdf(clinicId, clinicName);
}
