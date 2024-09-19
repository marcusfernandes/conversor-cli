#!/usr/bin/env node
import inquirer from 'inquirer';
import axios from 'axios';
import chalk from 'chalk';

// Tipagem para o resultado da API
interface CurrencyResponse {
  [key: string]: {
    bid: string;
  };
}

// URL da API para consulta
const API_URL = 'https://economia.awesomeapi.com.br/json';

// Lista de continentes e países
const continents = {
  "América": ["USD", "BRL", "CAD", "ARS", "CLP"],
  "Europa": ["EUR", "GBP", "CHF"],
  "Ásia": ["JPY", "CNY", "KRW", "INR"],
  "África": ["ZAR", "EGP", "NGN"],
  "Oceania": ["AUD", "NZD"],
} as any;

// Função para buscar lista de moedas
async function fetchCurrencies(): Promise<string[]> {
  try {
    const response = await axios.get(`${API_URL}/available/uniq`);
    return Object.keys(response.data);
  } catch (error) {
    console.error(chalk.red('Erro ao buscar as moedas disponíveis!'));
    process.exit(1);
  }
}

// Função para realizar a conversão de moedas
async function convertCurrency(from: string, to: string, amount: number): Promise<void> {
  try {
    const response = await axios.get<CurrencyResponse>(`${API_URL}/last/${from}-${to}`);
    const data = response.data[`${from}${to}`];
    const result = amount * parseFloat(data.bid);
    console.log(
      chalk.green(`\n${amount} ${from} é equivalente a ${result.toFixed(2)} ${to}.\n`)
    );
  } catch (error) {
    console.error(chalk.red('Erro ao realizar a conversão!'));
    process.exit(1);
  }
}

// Função para exibir o menu principal
async function promptUser(): Promise<void> {
  const mainMenuChoices = ['Converter Moedas', 'Filtrar Países por Continente', 'Sair'];

  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'O que você gostaria de fazer?',
    choices: mainMenuChoices,
  });

  if (action === 'Sair') {
    console.log(chalk.blue('Saindo do sistema...'));
    process.exit(0);
  }

  if (action === 'Converter Moedas') {
    // Buscando as moedas disponíveis
    const currencies = await fetchCurrencies();
    
    if (!currencies) return;

    // Perguntas para conversão de moedas
    const questions = [
      {
        type: 'list',
        name: 'fromCurrency',
        message: 'Selecione a moeda de origem:',
        choices: currencies,
      },
      {
        type: 'list',
        name: 'toCurrency',
        message: 'Selecione a moeda de destino:',
        choices: currencies,
      },
      {
        type: 'input',
        name: 'amount',
        message: 'Digite o valor a ser convertido:',
        validate: (input: string) => {
          return !isNaN(Number(input)) || 'Por favor, insira um número válido!';
        },
      },
    ];

    const { fromCurrency, toCurrency, amount } = await inquirer.prompt(questions as any);
    await convertCurrency(fromCurrency, toCurrency, parseFloat(amount));
  }

  if (action === 'Filtrar Países por Continente') {
    // Escolha de continente
    const { continent } = await inquirer.prompt({
      type: 'list',
      name: 'continent',
      message: 'Selecione o continente:',
      choices: Object.keys(continents),
    });

    // Moedas disponíveis no continente
    const availableCurrencies = continents[continent];

    const { fromCurrency, toCurrency, amount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'fromCurrency',
        message: 'Selecione a moeda de origem:',
        choices: availableCurrencies,
      },
      {
        type: 'list',
        name: 'toCurrency',
        message: 'Selecione a moeda de destino:',
        choices: availableCurrencies,
      },
      {
        type: 'input',
        name: 'amount',
        message: 'Digite o valor a ser convertido:',
        validate: (input: string) => {
          return !isNaN(Number(input)) || 'Por favor, insira um número válido!';
        },
      },
    ]);

    await convertCurrency(fromCurrency, toCurrency, parseFloat(amount));
  }

  // Chama novamente o prompt para manter o loop
  await promptUser();
}

// Iniciando o CLI
promptUser();
