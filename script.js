(function(){

  /* ============ Tab switching ============ */
  const panels   = document.querySelectorAll('.panel');
  const topTabs  = document.querySelectorAll('.toptab');
  const bNavItems= document.querySelectorAll('.bnav-item');
  const allTabLinks = document.querySelectorAll('[data-tab-link]');

  function goToTab(name){
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === name));
    topTabs.forEach(t => {
      const active = t.dataset.tabLink === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    bNavItems.forEach(b => b.classList.toggle('is-active', b.dataset.tabLink === name));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  allTabLinks.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goToTab(el.dataset.tabLink);
    });
  });

  /* ============ Terms accordion ============ */
  const accItems = document.querySelectorAll('.acc-item');
  accItems.forEach(item => {
    const trigger = item.querySelector('.acc-trigger');
    trigger.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      accItems.forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  /* ============ EMI logic ============ */
  // Profit model: total profit as a % of principal, rising with tenure.
  // 1 month -> 20% (₹1,000 profit on a ₹5,000 loan, as specified)
  // 2 months -> 30%, 3 months -> 40%, 4 months -> 50%
  function profitRate(months){
    return 0.20 + (months - 1) * 0.10;
  }
  const PROCESSING_FEE_RATE = 0.02; // one-time, cut from the disbursed amount

  const amountEl   = document.getElementById('amount');
  const amountValue= document.getElementById('amountValue');
  const tenureTabs = document.getElementById('tenureTabs');
  const segs       = tenureTabs.querySelectorAll('.seg');

  const disbursedValue = document.getElementById('disbursedValue');
  const emiValue        = document.getElementById('emiValue');
  const feeNote          = document.getElementById('feeNote');

  const bdAmount    = document.getElementById('bd-amount');
  const bdFee       = document.getElementById('bd-fee');
  const bdDisbursed = document.getElementById('bd-disbursed');
  const bdService   = document.getElementById('bd-service');
  const bdRepayable = document.getElementById('bd-repayable');
  const bdTotalCost  = document.getElementById('bd-totalcost');
  const scheduleBody = document.getElementById('scheduleBody');

  let currentMonths = 1;
  let splitChart;

  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

  function compute(amount, months){
    const totalProfit      = amount * profitRate(months);
    const fee               = amount * PROCESSING_FEE_RATE;
    const interestComponent = totalProfit - fee;
    const disbursed          = amount - fee;
    const totalRepayable     = amount + interestComponent;
    const emi                = totalRepayable / months;
    return { totalProfit, fee, interestComponent, disbursed, totalRepayable, emi };
  }

  function renderSchedule(totalRepayable, emi, months){
    scheduleBody.innerHTML = '';
    let paidSoFar = 0;
    for (let m = 1; m <= months; m++){
      paidSoFar += emi;
      const remaining = Math.max(totalRepayable - paidSoFar, 0);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>Month ' + m + '</td>' +
        '<td>' + inr(emi) + '</td>' +
        '<td>' + inr(paidSoFar) + '</td>' +
        '<td>' + inr(remaining) + '</td>';
      scheduleBody.appendChild(tr);
    }
  }

  function render(){
    const amount = Number(amountEl.value);
    amountValue.textContent = inr(amount);

    const { totalProfit, fee, disbursed, totalRepayable, emi } = compute(amount, currentMonths);

    disbursedValue.textContent = inr(disbursed);
    feeNote.textContent = 'after a ' + inr(fee) + ' one-time processing fee';
    emiValue.textContent = currentMonths === 1 ? inr(emi) : inr(emi) + ' / mo';

    bdAmount.textContent    = inr(amount);
    bdFee.textContent       = '−' + inr(fee);
    bdDisbursed.textContent = inr(disbursed);
    bdService.textContent   = inr(totalProfit - fee);
    bdRepayable.textContent = inr(totalRepayable);
    bdTotalCost.textContent = inr(totalProfit);

    renderSchedule(totalRepayable, emi, currentMonths);

    const chartData = [disbursed, totalProfit];
    if (!splitChart){
      const ctx = document.getElementById('splitChart').getContext('2d');
      splitChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Amount you receive', 'Total cost (fee + service charge)'],
          datasets: [{
            data: chartData,
            backgroundColor: ['#2cc7f2', '#3a4258'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          cutout: '66%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#dbe1ea', boxWidth: 12, font: { family: 'Inter', size: 12 } } },
            tooltip: { callbacks: { label: (c) => c.label + ': ' + inr(c.parsed) } }
          }
        }
      });
    } else {
      splitChart.data.datasets[0].data = chartData;
      splitChart.update();
    }
  }

  amountEl.addEventListener('input', render);
  segs.forEach(seg => {
    seg.addEventListener('click', () => {
      segs.forEach(s => { s.classList.remove('is-active'); s.setAttribute('aria-selected','false'); });
      seg.classList.add('is-active');
      seg.setAttribute('aria-selected','true');
      currentMonths = Number(seg.dataset.months);
      render();
    });
  });

  render();
})();
