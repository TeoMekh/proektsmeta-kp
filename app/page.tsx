"use client";

import { useMemo, useState } from "react";

const rub = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });

type Stage = { id: string; name: string; short: string; share: number; bim: number; enabled: boolean };

export default function Home() {
  const [area, setArea] = useState(2900);
  const [index, setIndex] = useState(1.68);
  const [vat, setVat] = useState(5);
  const [sketch, setSketch] = useState(true);
  const [stages, setStages] = useState<Stage[]>([
    { id: "p", name: "Проектная документация", short: "П", share: 60, bim: 1.14, enabled: true },
    { id: "r", name: "Рабочая документация", short: "Р", share: 40, bim: 1.16, enabled: true },
  ]);
  const [activeStep, setActiveStep] = useState(3);

  const calc = useMemo(() => {
    const a = 1_076_200;
    const b = 1_563;
    const base = a + b * area;
    const rows = stages.filter(s => s.enabled).map(s => ({
      ...s,
      total: base * (s.share / 100) * s.bim * index,
    }));
    const sketchTotal = sketch ? base * 0.2 * index : 0;
    const subtotal = rows.reduce((sum, row) => sum + row.total, 0) + sketchTotal;
    const vatTotal = subtotal * vat / 100;
    return { a, b, base, rows, sketchTotal, subtotal, vatTotal, total: subtotal + vatTotal };
  }, [area, index, sketch, stages, vat]);

  const updateStage = (id: string, field: "share" | "bim" | "enabled", value: number | boolean) => {
    setStages(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">П</span><span>ПроектСмета</span></div>
        <nav>
          <button className="navItem active"><span>⌁</span> Расчёты</button>
          <button className="navItem"><span>▤</span> Коммерческие предложения</button>
          <button className="navItem"><span>▦</span> Нормативы</button>
          <button className="navItem"><span>◎</span> Заказчики</button>
        </nav>
        <div className="sidebarBottom">
          <button className="navItem"><span>⚙</span> Настройки</button>
          <div className="profile"><div className="avatar">Ф</div><div><strong>Фёдор</strong><small>Проектная организация</small></div><span>⋮</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="crumb">Расчёты</span><span className="slash">/</span><span>Новый расчёт</span></div>
          <div className="topActions"><button className="ghost">Сохранить черновик</button><button className="primary">Сформировать КП</button></div>
        </header>

        <div className="content">
          <div className="titleRow">
            <div><div className="eyebrow">РАСЧЁТ № 26-216</div><h1>Детское дошкольное учреждение</h1><p>Екатеринбург, ул. Стрелочников · новое строительство</p></div>
            <span className="status">Черновик</span>
          </div>

          <div className="steps">
            {["Объект", "Состав работ", "Расчёт", "Результат"].map((step, i) => <button key={step} className={activeStep === i + 1 ? "step active" : activeStep > i + 1 ? "step done" : "step"} onClick={() => setActiveStep(i + 1)}><span>{activeStep > i + 1 ? "✓" : i + 1}</span>{step}</button>)}
          </div>

          <div className="grid">
            <div className="mainColumn">
              <section className="card">
                <div className="cardHead"><div><h2>Метод расчёта</h2><p>Нормативные затраты по натуральному показателю</p></div><span className="valid">✓ Норматив применим</span></div>
                <div className="normative">
                  <div className="docIcon">§</div><div><strong>Приказ Минстроя России № 848/пр</strong><p>Объекты жилищно-гражданского назначения</p><div className="chips"><span>Таблица 3.8</span><span>Пункт 1</span><span>База 01.01.2021</span></div></div><button className="linkButton">Изменить</button>
                </div>
              </section>

              <section className="card">
                <div className="cardHead"><div><h2>Исходные параметры</h2><p>Параметры объекта и пересчёта стоимости</p></div></div>
                <div className="fields">
                  <label><span>Общая площадь</span><div className="inputUnit"><input type="number" value={area} onChange={e => setArea(Number(e.target.value))}/><b>м²</b></div></label>
                  <label><span>Вместимость</span><div className="inputUnit"><input type="number" defaultValue={150}/><b>мест</b></div></label>
                  <label><span>Уровень текущих цен</span><select defaultValue="q2"><option value="q2">II квартал 2026</option><option>IV квартал 2025</option></select></label>
                  <label><span>Индекс к 01.01.2021</span><div className="inputUnit"><input type="number" step="0.01" value={index} onChange={e => setIndex(Number(e.target.value))}/><b>Кинф</b></div><small>Письмо № 20212-ИФ/09</small></label>
                </div>
                <div className="formula"><span>Базовая стоимость</span><code>1 076 200 + 1 563 × {area.toLocaleString("ru-RU")} = <strong>{rub.format(calc.base)}</strong></code></div>
              </section>

              <section className="card">
                <div className="cardHead"><div><h2>Стадии и коэффициенты</h2><p>Распределение стоимости при информационном моделировании</p></div><span className="infoPill">ТИМ включён</span></div>
                <div className="stageList">
                  {stages.map(stage => <div className="stageRow" key={stage.id}>
                    <input className="check" type="checkbox" checked={stage.enabled} onChange={e => updateStage(stage.id, "enabled", e.target.checked)}/>
                    <span className="stageBadge">{stage.short}</span><div className="stageName"><strong>{stage.name}</strong><small>{stage.short === "П" ? "Состав по Постановлению № 87" : "Комплекты рабочих марок"}</small></div>
                    <label><small>Доля</small><div className="miniInput"><input type="number" value={stage.share} onChange={e => updateStage(stage.id, "share", Number(e.target.value))}/><b>%</b></div></label>
                    <label><small>Коэф. ТИМ</small><input className="smallInput" type="number" step="0.01" value={stage.bim} onChange={e => updateStage(stage.id, "bim", Number(e.target.value))}/></label>
                    <strong className="rowTotal">{rub.format(calc.rows.find(r => r.id === stage.id)?.total || 0)}</strong>
                  </div>)}
                  <div className="stageRow compact"><input className="check" type="checkbox" checked={sketch} onChange={e => setSketch(e.target.checked)}/><span className="stageBadge pale">ЭП</span><div className="stageName"><strong>Эскизный проект</strong><small>20% от базовой стоимости</small></div><span className="basis">Приказ № 911/пр</span><strong className="rowTotal">{rub.format(calc.sketchTotal)}</strong></div>
                </div>
                <button className="addButton">＋ Добавить работу другим методом</button>
              </section>

              <section className="card subtle">
                <div className="cardHead"><div><h2>Дополнительные факторы</h2><p>Повторяемость секций, сложность и коммерческие корректировки</p></div><button className="linkButton">Настроить</button></div>
                <div className="factorGrid"><div><span>Повторяемость</span><strong>Не применяется</strong></div><div><span>Техническая сложность</span><strong>Обычная · 1,00</strong></div><div><span>Срочность</span><strong>Стандартная · 1,00</strong></div></div>
              </section>
            </div>

            <aside className="summary card">
              <div className="summaryHead"><span>ИТОГ РАСЧЁТА</span><button>⋮</button></div>
              <div className="sumRows">
                {calc.rows.map(row => <div key={row.id}><span>{row.name}</span><strong>{rub.format(row.total)}</strong></div>)}
                {sketch && <div><span>Эскизный проект</span><strong>{rub.format(calc.sketchTotal)}</strong></div>}
              </div>
              <div className="divider"/>
              <div className="sumRows"><div><span>Итого без НДС</span><strong>{rub.format(calc.subtotal)}</strong></div><div><span>НДС</span><select value={vat} onChange={e => setVat(Number(e.target.value))}><option value="0">Без НДС</option><option value="5">5%</option><option value="7">7%</option><option value="20">20%</option></select><strong>{rub.format(calc.vatTotal)}</strong></div></div>
              <div className="grandTotal"><span>Стоимость предложения</span><strong>{rub.format(calc.total)}</strong><small>с учётом НДС {vat}%</small></div>
              <div className="summaryNote"><span>i</span><p>Все суммы пересчитываются автоматически. Нормативная база и формулы войдут в приложение к КП.</p></div>
              <button className="primary wide">Перейти к результату →</button>
              <button className="ghost wide">Посмотреть расшифровку</button>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
