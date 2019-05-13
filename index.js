var token = '708879772:AAGAqs1e81wgeT_F8pxHXJucWO38kaQdPzg';
var jsforce = require('jsforce');
var Telegraf = require('telegraf');
var Calendar = require('telegraf-calendar-telegram');
const { Router, Markup } = Telegraf;
var bot = new Telegraf(token);
var conn = new jsforce.Connection();
var loginUsernameOrg = '';
var loginPasswordOrg = '';
var ContactEmail = '';
var ContactPassword = '';
var Amount = '';
var Description = '';
var SelDate = '';
var conId = "";
const errorOrg = 'Wrong login or password for your org, please try again.'
const errorCont = 'Wrong Email or Password for your Contact, please try again.'
const errorData = 'Entered data in invalid format, please try again.'
const calendar = new Calendar(bot, {
  startWeekDay: 0,
  weekDayNames: ["S", "M", "T", "W", "T", "F", "S"],
  monthNames: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],
  minDate: null,
  maxDate: null
});

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'https://expense-tg-bot.herokuapp.com';
bot.telegram.setWebhook(`${URL}/bot${token}`);
bot.startWebhook(`/bot${token}`, null, PORT);

bot.start((ctx) => {
  ctx.reply('Please input Login of your org.')
  loginUsernameOrg = '';
  loginPasswordOrg = '';
  ContactEmail = '';
  ContactPassword = '';
  Amount = 0;
  Description = '';
  SelDate = '';
  conId = "";
});

bot.on('text', (ctx) => {

  if (!loginUsernameOrg) {
    loginUsernameOrg = ctx.message.text;
    ctx.reply('Please input Password of your org.')
  }

  else if (!loginPasswordOrg) {
    loginPasswordOrg = ctx.message.text;
    ctx.reply('Input email of your Contact.')
  }

  else if (!ContactEmail) {
    ContactEmail = ctx.message.text;
    ctx.reply('Input password of your Contact.')
  }

  else if (!ContactPassword) {
    ContactPassword = ctx.message.text;
    ctx.reply('Please wait while i\'m check your Contact...')
    conn.login(loginUsernameOrg, loginPasswordOrg, function (err, res) {

      if (err) { return ctx.reply(errorOrg) }
      else {
        conn.query("SELECT Id, Email, Password__c, Name FROM Contact WHERE Email ='" + ContactEmail + "' AND Password__c ='" + ContactPassword + "'", function (err, res) {

          if (err) { ctx.reply(errorCont) }
          else {
            var data = res.records;
            conId = data[0].Id;
            ctx.reply("Hello " + data[0].Name + " , please choose option", Markup.inlineKeyboard([
              Markup.callbackButton('Balance', 'balance'),
              Markup.callbackButton('New Expense Card', 'newCard'),
              Markup.callbackButton('End', 'end')
            ]).extra());

            bot.action('balance', (ctx) => {
              conn.query("SELECT Reminder__c FROM Monthly_Expense__c WHERE Keeper__c ='" + conId + "'", function (err, res) {
                var rem = res.records;
                var aaa = 0;
                for (var i = 0; i < rem.length; i++) {
                  aaa = aaa + rem[i].Reminder__c;
                };
                ctx.editMessageText("Your Balance: " + aaa + ". Do you want to create new Expense Card?", Markup.inlineKeyboard([
                  Markup.callbackButton('Yes', 'yes'),
                  Markup.callbackButton('No', 'no')
                ]).extra());
              });
            });
          };
        });
      };
    });
  }

  else if (Amount == 0) {
    Amount = ctx.message.text;
    ctx.reply('Enter Description');
    Description = '';
  }

  else if (!Description && SelDate != '') {
    Description = ctx.message.text;
    conn.sobject("Expense_Card__c").create({ Amount__c: Amount, Description__c: Description, Card_Date__c: SelDate, Card_Keeper__c: conId }, function (err, ret) {
      if (err || !ret.success) {
        SelDate = '';
        return ctx.reply(errorData, Markup.inlineKeyboard([
          Markup.callbackButton('Balance', 'balance'),
          Markup.callbackButton('New Expense Card', 'newCard'),
          Markup.callbackButton('End', 'end')
        ]).extra())
      }
      SelDate = '';
      conn.query("SELECT Reminder__c FROM Monthly_Expense__c WHERE Keeper__c ='" + conId + "'", function (err, res) {
        var rem = res.records;
        var aaa = 0;
        for (var i = 0; i < rem.length; i++) {
          aaa = aaa + rem[i].Reminder__c;
        };
      ctx.reply("Expense card succsesfully created, your balance now: " + aaa + ". Please choose option", Markup.inlineKeyboard([
        Markup.callbackButton('Balance', 'balance'),
        Markup.callbackButton('New Expense Card', 'newCard'),
        Markup.callbackButton('End', 'end')
      ]).extra());
    });
    });
  }

  else if (!Description && SelDate == '') {
    const today = new Date();
    const minDate = new Date();
    minDate.setMonth(today.getMonth() - 200);
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 200);
    maxDate.setDate(today.getDate());

    Description = ctx.message.text;
    ctx.reply("Choose date.", calendar.setMinDate(minDate).setMaxDate(maxDate).getCalendar())
    calendar.setDateListener((ctx, date) => {
      ctx.reply(date)
      SelDate = date;
      conn.sobject("Expense_Card__c").create({ Amount__c: Amount, Description__c: Description, Card_Date__c: SelDate, Card_Keeper__c: conId }, function (err, ret) {
        if (err || !ret.success) {
          SelDate = '';
          return ctx.reply(errorData, Markup.inlineKeyboard([
            Markup.callbackButton('Balance', 'balance'),
            Markup.callbackButton('New Expense Card', 'newCard'),
            Markup.callbackButton('End', 'end')
          ]).extra())
        }
        SelDate = '';
        conn.query("SELECT Reminder__c FROM Monthly_Expense__c WHERE Keeper__c ='" + conId + "'", function (err, res) {
          var rem = res.records;
          var aaa = 0;
          for (var i = 0; i < rem.length; i++) {
            aaa = aaa + rem[i].Reminder__c;
          };
        ctx.reply("Expense card succsesfully created, your balance now: " + aaa + ". Please choose option", Markup.inlineKeyboard([
          Markup.callbackButton('Balance', 'balance'),
          Markup.callbackButton('New Expense Card', 'newCard'),
          Markup.callbackButton('End', 'end')
        ]).extra());
      });
      });
    });
  }

  bot.action('newCard', (ctx) => {
    ctx.editMessageText("Please choose option.", Markup.inlineKeyboard([
      Markup.callbackButton('Today', 'today'),
      Markup.callbackButton('Other day', 'otherDay')
    ]).extra());
  })

  bot.action('yes', (ctx) => {
    ctx.editMessageText("Please choose option.", Markup.inlineKeyboard([
      Markup.callbackButton('Today', 'today'),
      Markup.callbackButton('Other day', 'otherDay')
    ]).extra());
  });

  bot.action('no', (ctx) => {
    Amount = 1;
    Description = 'a';
    ctx.editMessageText("Please choose option.", Markup.inlineKeyboard([
      Markup.callbackButton('Balance', 'balance'),
      Markup.callbackButton('New Expense Card', 'newCard'),
      Markup.callbackButton('End', 'end')
    ]).extra())
  });

  bot.action('end', (ctx) => {
    Amount = 1;
    Description = 'a';
    return ctx.editMessageText('Ok, have a nice day')
  });

  bot.action('today', (ctx) => {
    Amount = 0;
    SelDate = new Date();
    ctx.editMessageText('Enter Amount');
  });

  bot.action('otherDay', (ctx) => {
    Amount = 0;
    ctx.editMessageText('Enter Amount');
  });
})

bot.launch()
//bot.startPolling();