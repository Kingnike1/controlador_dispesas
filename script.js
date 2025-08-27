// Dados globais
let expenses = JSON.parse(localStorage.getItem('expenses')) || []
let chart = null

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
  // Definir data atual como padrão
  document.getElementById('data').valueAsDate = new Date()

  // Carregar dados salvos
  loadExpenses()
  updateDashboard()
  updateChart()

  // Event listeners
  document.getElementById('expenseForm').addEventListener('submit', addExpense)
  document.getElementById('monthFilter').addEventListener('change', filterByMonth)
  document.getElementById('sortBy').addEventListener('change', sortExpenses)
})

// Adicionar nova despesa
function addExpense(e) {
  e.preventDefault()

  const formData = {
    id: Date.now(),
    data: document.getElementById('data').value,
    descricao: document.getElementById('descricao').value,
    valor: parseFloat(document.getElementById('valor').value),
    tipo: document.getElementById('tipo').value,
    categoria: document.getElementById('categoria').value,
  }

  // Validação
  if (
    !formData.data ||
    !formData.descricao ||
    !formData.valor ||
    !formData.tipo ||
    !formData.categoria
  ) {
    alert('Por favor, preencha todos os campos obrigatórios.')
    return
  }

  if (formData.valor <= 0) {
    alert('O valor deve ser maior que zero.')
    return
  }

  // Adicionar à lista
  expenses.push(formData)

  // Salvar no localStorage
  localStorage.setItem('expenses', JSON.stringify(expenses))

  // Atualizar interface
  loadExpenses()
  updateDashboard()
  updateChart()

  // Mostrar mensagem de sucesso
  showSuccessMessage()

  // Limpar formulário
  document.getElementById('expenseForm').reset()
  document.getElementById('data').valueAsDate = new Date()
}

// Mostrar mensagem de sucesso
function showSuccessMessage() {
  const message = document.getElementById('successMessage')
  message.style.display = 'block'
  setTimeout(() => {
    message.style.display = 'none'
  }, 3000)
}

// Carregar despesas na tabela
function loadExpenses() {
  const tbody = document.getElementById('expenseTableBody')

  if (expenses.length === 0) {
    tbody.innerHTML = `
                    <tr class="empty-state">
                        <td colspan="5">
                            <div>
                                <div style="font-size: 3rem; margin-bottom: 10px;">📊</div>
                                <h3>Nenhum registro encontrado</h3>
                                <p>Adicione seu primeiro gasto ou despesa para começar!</p>
                            </div>
                        </td>
                    </tr>
                `
    return
  }

  let filteredExpenses = [...expenses]

  // Aplicar filtro de mês se selecionado
  const monthFilter = document.getElementById('monthFilter').value
  if (monthFilter) {
    filteredExpenses = expenses.filter((expense) => {
      const expenseMonth = expense.data.substring(0, 7)
      return expenseMonth === monthFilter
    })
  }

  // Ordenar
  const sortBy = document.getElementById('sortBy').value
  filteredExpenses.sort((a, b) => {
    if (sortBy === 'valor') {
      return b.valor - a.valor
    } else if (sortBy === 'data') {
      return new Date(b.data) - new Date(a.data)
    } else if (sortBy === 'categoria') {
      return a.categoria.localeCompare(b.categoria)
    }
    return 0
  })

  if (filteredExpenses.length === 0) {
    tbody.innerHTML = `
                    <tr class="empty-state">
                        <td colspan="5">
                            <div>
                                <div style="font-size: 3rem; margin-bottom: 10px;">🔍</div>
                                <h3>Nenhum registro encontrado</h3>
                                <p>Não há registros para o período selecionado.</p>
                            </div>
                        </td>
                    </tr>
                `
    return
  }

  tbody.innerHTML = filteredExpenses
    .map((expense) => {
      const isHighValue = expense.valor > 500
      const formattedDate = new Date(expense.data + 'T00:00:00').toLocaleDateString('pt-BR')
      const formattedValue = expense.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })

      return `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${expense.descricao}</td>
                        <td><span class="tipo-${expense.tipo.toLowerCase()}">${
        expense.tipo
      }</span></td>
                        <td>${expense.categoria}</td>
                        <td class="${isHighValue ? 'valor-alto' : ''}">${formattedValue}</td>
                    </tr>
                `
    })
    .join('')
}

// Atualizar dashboard
function updateDashboard() {
  const currentMonth = new Date().toISOString().substring(0, 7)
  const monthlyExpenses = expenses.filter(
    (expense) => expense.data.substring(0, 7) === currentMonth
  )

  const totalGastos = monthlyExpenses
    .filter((expense) => expense.tipo === 'Gasto')
    .reduce((sum, expense) => sum + expense.valor, 0)

  const totalDespesas = monthlyExpenses
    .filter((expense) => expense.tipo === 'Despesa')
    .reduce((sum, expense) => sum + expense.valor, 0)

  const saldo = totalGastos - totalDespesas

  document.getElementById('totalGastos').textContent = totalGastos.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  document.getElementById('totalDespesas').textContent = totalDespesas.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  document.getElementById('saldo').textContent = saldo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  // Atualizar cor do saldo
  const saldoElement = document.getElementById('saldo')
  if (saldo > 0) {
    saldoElement.style.color = '#27ae60'
  } else if (saldo < 0) {
    saldoElement.style.color = '#e74c3c'
  } else {
    saldoElement.style.color = '#f39c12'
  }
}

// Atualizar gráfico
function updateChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d')

  // Calcular gastos por categoria
  const categoryData = {}
  const categoryColors = {
    Alimentação: '#FF6384',
    Transporte: '#36A2EB',
    Lazer: '#FFCE56',
    Saúde: '#4BC0C0',
    Educação: '#9966FF',
    Outros: '#FF9F40',
  }

  expenses.forEach((expense) => {
    if (expense.tipo === 'Gasto') {
      categoryData[expense.categoria] = (categoryData[expense.categoria] || 0) + expense.valor
    }
  })

  const labels = Object.keys(categoryData)
  const data = Object.values(categoryData)
  const colors = labels.map((label) => categoryColors[label] || '#95a5a6')

  if (chart) {
    chart.destroy()
  }

  if (labels.length === 0) {
    // Mostrar gráfico vazio
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Nenhum dado'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#ecf0f1'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    })
    return
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${context.label}: ${value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })} (${percentage}%)`
            },
          },
        },
      },
      animation: {
        animateRotate: true,
        duration: 1000,
      },
    },
  })
}

// Filtrar por mês
function filterByMonth() {
  loadExpenses()
}

// Ordenar despesas
function sortExpenses() {
  loadExpenses()
}

// Ordenar tabela
function sortTable(column) {
  document.getElementById('sortBy').value = column
  loadExpenses()
}

// Exportar para CSV
function exportToCSV() {
  if (expenses.length === 0) {
    alert('Não há dados para exportar.')
    return
  }

  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor']
  const csvContent = [
    headers.join(','),
    ...expenses.map((expense) =>
      [
        expense.data,
        `"${expense.descricao}"`,
        expense.tipo,
        expense.categoria,
        expense.valor.toFixed(2).replace('.', ','),
      ].join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `gastos_despesas_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
;(function () {
  function c() {
    var b = a.contentDocument || a.contentWindow.document
    if (b) {
      var d = b.createElement('script')
      d.innerHTML =
        "window.__CF$cv$params={r:'9746ba11a5784fa6',t:'MTc1NjA3OTE2My4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);"
      b.getElementsByTagName('head')[0].appendChild(d)
    }
  }
  if (document.body) {
    var a = document.createElement('iframe')
    a.height = 1
    a.width = 1
    a.style.position = 'absolute'
    a.style.top = 0
    a.style.left = 0
    a.style.border = 'none'
    a.style.visibility = 'hidden'
    document.body.appendChild(a)
    if ('loading' !== document.readyState) c()
    else if (window.addEventListener) document.addEventListener('DOMContentLoaded', c)
    else {
      var e = document.onreadystatechange || function () {}
      document.onreadystatechange = function (b) {
        e(b)
        'loading' !== document.readyState && ((document.onreadystatechange = e), c())
      }
    }
  }
})()
// Referências aos elementos
const totalGastosEl = document.getElementById('totalGastos');
const totalDespesasEl = document.getElementById('totalDespesas');
const saldoEl = document.getElementById('saldo');
const valorDisponivelInput = document.getElementById('valorDisponivelInput');
const valorDisponivelEl = document.getElementById('valorDisponivel');

let registros = [];
let totalGastos = 0;
let totalDespesas = 0;
let valorDisponivel = 0;

// Função para atualizar totais e saldo
function atualizarDashboard() {
    // Calcular totais
    totalGastos = registros
        .filter(r => r.tipo === 'Gasto')
        .reduce((acc, cur) => acc + cur.valor, 0);
    totalDespesas = registros
        .filter(r => r.tipo === 'Despesa')
        .reduce((acc, cur) => acc + cur.valor, 0);

    totalGastosEl.textContent = `R$ ${totalGastos.toFixed(2)}`;
    totalDespesasEl.textContent = `R$ ${totalDespesas.toFixed(2)}`;

    // Calcular saldo real considerando valor disponível
    let saldo = valorDisponivel - (totalGastos + totalDespesas);
    saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;

    // Destacar saldo negativo
    if (saldo < 0) {
        saldoEl.style.color = 'red';
    } else {
        saldoEl.style.color = 'green';
    }
}

// Atualizar valor disponível quando o usuário digitar
valorDisponivelInput.addEventListener('input', () => {
    valorDisponivel = parseFloat(valorDisponivelInput.value) || 0;
    valorDisponivelEl.textContent = `R$ ${valorDisponivel.toFixed(2)}`;
    atualizarDashboard();
});

// Função para adicionar registro
function adicionarRegistro(data, descricao, valor, tipo, categoria) {
    registros.push({ data, descricao, valor, tipo, categoria });
    atualizarDashboard();
}

// Exemplo: adicionar registro pelo formulário
const form = document.getElementById('expenseForm');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;

    adicionarRegistro(data, descricao, valor, tipo, categoria);

    form.reset();
    document.getElementById('successMessage').style.display = 'block';
    setTimeout(() => {
        document.getElementById('successMessage').style.display = 'none';
    }, 2000);
});
