odoo.define('AccountingDashboard.AccountingDashboard', function (require) {
    'use strict';
    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var session = require('web.session');
    var web_client = require('web.web_client');
    var _t = core._t;
    var QWeb = core.qweb;
    var self = this;
    var currency;
    var ActionMenu = AbstractAction.extend({

        template: 'Invoicedashboard',


        events: {
            'click .invoice_dashboard': 'onclick_dashboard',

            'click #invoice_hide': 'onclick_invoice_hide',
            'click #income_hide': 'onclick_income_hide',
            'click #ex_hide': 'onclick_ex_hide',
            'click #due_hide': 'onclick_due_hide',
            'click #top_10_hide': 'onclick_top_10_hide',
            'click #late_hide': 'onclick_late_hide',
            'click #prog_bar': 'onclick_prog_bar',

            'click #invoice_this_month': 'onclick_invoice_this_month',
            'click #invoice_this_year': 'onclick_invoice_this_year',
            'click #invoice_last_month': 'onclick_invoice_last_month',
            'click #invoice_last_year': 'onclick_invoice_last_year',

            'click #onclick_banks_balance': 'onclick_bank_balance',

            'click #income_this_month': 'onclick_income_this_month',
            'click #income_this_year': 'onclick_income_this_year',
            'click #income_last_month': 'onclick_income_last_month',
            'click #income_last_year': 'onclick_income_last_year',

            'click #aged_payable_this_month': 'onclick_aged_payable_this_month',
            'click #aged_receivable_this_year': 'onclick_aged_receivable_this_year',
            'click #total_aged_payable': 'onclick_total_aged_payable',
            'click #aged_payable_this_year': 'onclick_aged_payable_this_year',

            'click #in_ex_bar_chart': 'onclick_in_ex_bar_chart',
            'click #aged_recevable_pie_chart': 'onclick_aged_recevable_pie_chart',
            'click #invoice_bar_chart': 'onclick_invoice_bar_chart',
            'click .overdue_line_cust': 'onclick_overdue_line_cust',
            'click .top_customers': 'onclick_top_customers',
            'click .top_customers_amount': 'onclick_top_customers_amount',
            'click #aged_receivable_this_month': 'onclick_aged_receivable_this_month',

            'click #bank_balance_hide': 'onclick_bank_balance_hide',
            'click #cash_balance_hide': 'onclick_cash_balance_hide',
            'click #in_ex_hide': 'onclick_in_ex_hide',
            'click #aged_payable_hide': 'onclick_aged_payable_hide',
            'click #top_10_customer_this_month': 'onclick_top_10_customer_this_month',
            'click #top_10_customer_last_month': 'onclick_top_10_customer_last_month',

            'change #toggle-two': 'onclick_toggle_two',

        },
        onclick_toggle_two: function (ev) {


            this.onclick_aged_payable_this_month(ev);
            this.onclick_aged_payable_this_year(ev);

            this.onclick_aged_receivable_this_month(ev);
            this.onclick_aged_receivable_this_year(ev);

            this.onclick_invoice_this_year(ev);
            this.onclick_invoice_this_month(ev);

            this.onclick_income_this_month(ev);
            this.onclick_income_last_month(ev);
            this.onclick_income_last_year(ev);
            this.onclick_income_this_year(ev);
        },

        onclick_overdue_line_cust: function (ev) {
            ev.preventDefault();
            var data = $(ev.currentTarget).data();
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'res.partner',
                res_id: data['userId'],
                view_mode: 'form',
                views: [
                    [false, 'form']
                ],
            })
        },

        onclick_top_customers: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var data = $(ev.currentTarget).data();
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'res.partner',
                res_id: data['userId'],
                view_mode: 'tree,form',
                target: 'current',
                views: [
                    [false, 'tree'],
                    [false, 'form']
                ],
                context: {
                    create: false,
                    edit: false,
                }
            })
        },

        onclick_top_customers_amount: function (ev) {
            ev.preventDefault();
            var data = $(ev.currentTarget).data();
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'account.move',
                res_id: data['userId'],
                view_mode: 'list',

                views: [
                    [false, 'list']
                ],
                name: 'Faturas',
                domain: ['|',
                    ['type', '=', 'out_invoice'],
                    ['type', '=', 'out_refund'],
                    ['state', '=', 'posted'],
                    ['partner_id', 'child_of', data['userId'],]
                ],
                context: {
                    default_type: 'out_invoice',
                    type: 'out_invoice',
                    journal_type: 'sale',
                    create: false,
                    search_default_unpaid: 1,
                }

            })
        },

        onclick_prog_bar: function (ev) {
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'account.move',
                view_mode: 'tree,form',
                views: [
                    [false, 'list'],
                    [false, 'form']
                ],
                name: 'Faturas não pagas',

                domain: [
                    ['state', '=', 'posted'],
                    ['type', '=', 'out_invoice'],
                    ['invoice_payment_state', '=', 'not_paid']
                ]
            });
        },
        onclick_unreconciled_items: function (ev) {
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'account.move.line',
                view_mode: 'tree,form',
                target: 'new',
                views: [
                    [false, 'list'],
                    [false, 'form']
                ],
                name: 'Pagamentos não reconciliados',

                domain: [
                    ['full_reconcile_id', '=', false],
                    ['balance', '!=', 0],
                    ['account_id.reconcile', '=', true]
                ]
            });
        },

        onclick_unreconcile_items_this_years: function (ev) {

            this.do_action({
                type: 'ir.actions.act_window',
                res_model: 'account.move.line',
                view_mode: 'tree,form',
                target: 'new',
                views: [
                    [false, 'list'],
                    [false, 'form']
                ],
                name: 'Pagamentos não reconciliados',

                domain: [
                    ['full_reconcile_id', '=', false],
                    ['balance', '!=', 0],
                    ['account_id.reconcile', '=', true]
                ]
            });
        },

        onclick_unreconcile_items_this_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.selected');
            var data = $(selected[0]).data();

            $('#monthly_expense').show()
            $('#monthly_invoice').show()
            $('#monthly_income').show()
            $('#monthly_unreconciled').show()


            $('#yearly_expense').hide()
            $('#yearly_income').hide()
            $('#yearly_invoice').hide()
            $('#yearly_unreconciled').hide()
        },

        onclick_income_hide: function () {
            var x = document.getElementById("income_body");
            if (x.style.display === "none") {

                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        },
        onclick_ex_hide: function () {
            var x = document.getElementById("ex_body");
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        },
        onclick_due_hide: function () {
            var x = document.getElementById("due_body");

            if (x.style.display === "none") {
                x.style.display = "block";


            } else {
                x.style.display = "none";


            }
        },

        onclick_top_10_hide: function () {
            var x = document.getElementById("top_10_body");

            if (x.style.display === "none") {
                x.style.display = "block";


            } else {
                x.style.display = "none";


            }
        },

        onclick_bank_balance_hide: function () {
            var x = document.getElementById("bank_balance_body_hide");

            if (x.style.display === "none") {
                x.style.display = "block";


            } else {
                x.style.display = "none";


            }
        },
        onclick_in_ex_hide: function () {
            var x = document.getElementById("in_ex_body_hide");

            if (x.style.display === "none") {
                x.style.display = "block";


            } else {
                x.style.display = "none";


            }
        },

        onclick_aged_payable_hide: function () {
            var x = document.getElementById("aged_payable_body_hide");

            if (x.style.display === "none") {
                x.style.display = "block";


            } else {
                x.style.display = "none";


            }
        },

        onclick_cash_balance_hide: function () {
            var x = document.getElementById("cash_balance_body_hide");

            if (x.style.display === "none") {
                x.style.display = "block";


            } else {
                x.style.display = "none";


            }
        },

        onclick_late_hide: function () {


            var x = document.getElementById("late_body");
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        },

        onclick_invoice_hide: function () {
            var x = document.getElementById("invoice_body");
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }

        },

        onclick_top_10_customer_this_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.income');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }

            rpc.query({
                model: "account.move",
                method: "get_top_10_customers_this_month",
                args: [posted]

            })
                .then(function (result) {

                    $('#top_10_customers').hide();
                    $('#top_10_customers_last_month').hide();
                    $('#top_10_customers_this_month').show();
                    $('#top_10_customers_this_month').empty();

                    var due_count = 0;
                    _.forEach(result, function (x) {
                        due_count++;
                        $('#top_10_customers_this_month').append('<li><div id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + x.customers + '</div>' + '<div id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + currency + ' ' + x.amount.toFixed(2) + '</div>' + '</li>');

                    });
                })
        },

        onclick_top_10_customer_last_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.income');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: "account.move",
                method: "get_top_10_customers_last_month",
                args: [posted]
            })
                .then(function (result) {
                    $('#top_10_customers').hide();
                    $('#top_10_customers_this_month').hide();
                    $('#top_10_customers_last_month').show();
                    $('#top_10_customers_last_month').empty();
                    var due_count = 0;
                    _.forEach(result, function (x) {
                        due_count++;
                        $('#top_10_customers_last_month').append('<li><div id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + x.customers + '</div>' + '<div id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + currency + ' ' + x.amount.toFixed(2) + '</div>' + '</li>');
                    });
                })
        },

        onclick_income_last_year: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.income');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_income_last_year',
                args: [posted],
            })
                .then(function (result) {

                    $('#net_profit_this_months').hide();
                    $('#net_profit_last_month').hide();
                    $('#net_profit_last_year').show();
                    $('#net_profit_this_year').hide();

                    var ctx = document.getElementById("canvas").getContext('2d');

                    // Define the data
                    var income = result.income; // Add data values to array
                    var expense = result.expense;
                    var profit = result.profit;

                    var labels = result.month; // Add labels to array
                    // End Defining data

                    // End Defining data
                    if (window.myCharts != undefined)
                        window.myCharts.destroy();
                    window.myCharts = new Chart(ctx, {
                        //var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Receitas', // Name the series
                                data: income, // Specify the data values array
                                backgroundColor: '#66aecf',
                                borderColor: '#66aecf',

                                borderWidth: 1, // Specify bar border width
                                type: 'bar', // Set this data to a line chart
                                fill: false
                            },
                                {
                                    label: 'Despesas', // Name the series
                                    data: expense, // Specify the data values array
                                    backgroundColor: '#6993d6',
                                    borderColor: '#6993d6',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'bar', // Set this data to a line chart
                                    fill: false
                                },
                                {
                                    label: 'Receitas/Perdas', // Name the series
                                    data: profit, // Specify the data values array
                                    backgroundColor: '#0bd465',
                                    borderColor: '#0bd465',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'line', // Set this data to a line chart
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true, // Instruct chart js to respond nicely.
                            maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
                        }
                    });

                })
        },

        onclick_income_last_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.income');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_income_last_month',
                args: [posted],
            })
                .then(function (result) {
                    $('#net_profit_this_months').hide();
                    $('#net_profit_last_month').show();
                    $('#net_profit_this_year').hide();
                    $('#net_profit_last_year').hide();

                    var ctx = document.getElementById("canvas").getContext('2d');

                    // Define the data
                    var income = result.income; // Add data values to array
                    var expense = result.expense;
                    var profit = result.profit;

                    var labels = result.date; // Add labels to array
                    // End Defining data

                    // End Defining data
                    if (window.myCharts != undefined)
                        window.myCharts.destroy();
                    window.myCharts = new Chart(ctx, {
                        //var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Receitas', // Name the series
                                data: income, // Specify the data values array
                                backgroundColor: '#66aecf',
                                borderColor: '#66aecf',

                                borderWidth: 1, // Specify bar border width
                                type: 'bar', // Set this data to a line chart
                                fill: false
                            },
                                {
                                    label: 'Despesas', // Name the series
                                    data: expense, // Specify the data values array
                                    backgroundColor: '#6993d6',
                                    borderColor: '#6993d6',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'bar', // Set this data to a line chart
                                    fill: false
                                },
                                {
                                    label: 'Receita/Perdas', // Name the series
                                    data: profit, // Specify the data values array
                                    backgroundColor: '#0bd465',
                                    borderColor: '#0bd465',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'line', // Set this data to a line chart
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true, // Instruct chart js to respond nicely.
                            maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
                        }
                    });

                })
        },
        onclick_income_this_year: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.income');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }


            rpc.query({
                model: 'account.move',
                method: 'get_income_this_year',
                args: [posted],

            })
                .then(function (result) {


                    $('#net_profit_this_months').hide();
                    $('#net_profit_last_month').hide();
                    $('#net_profit_last_year').hide();
                    $('#net_profit_this_year').show();

                    var ctx = document.getElementById("canvas").getContext('2d');

                    // Define the data
                    var income = result.income; // Add data values to array
                    var expense = result.expense;
                    var profit = result.profit;

                    var labels = result.month; // Add labels to array


                    if (window.myCharts != undefined)
                        window.myCharts.destroy();
                    window.myCharts = new Chart(ctx, {
                        //var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Receita', // Name the series
                                data: income, // Specify the data values array
                                backgroundColor: '#66aecf',
                                borderColor: '#66aecf',

                                borderWidth: 1, // Specify bar border width
                                type: 'bar', // Set this data to a line chart
                                fill: false
                            },
                                {
                                    label: 'Despesas', // Name the series
                                    data: expense, // Specify the data values array
                                    backgroundColor: '#6993d6',
                                    borderColor: '#6993d6',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'bar', // Set this data to a line chart
                                    fill: false
                                },
                                {
                                    label: 'Receitas/Perdas', // Name the series
                                    data: profit, // Specify the data values array
                                    backgroundColor: '#0bd465',
                                    borderColor: '#0bd465',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'line', // Set this data to a line chart
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true, // Instruct chart js to respond nicely.
                            maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
                        }
                    });

                })
        },
        onclick_bank_balance: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.selected');
            var data = $(selected[0]).data();
            var self = this;

            rpc.query({
                model: "account.move",
                method: "bank_balance",
            })
                .then(function (result) {

                    var banks = result['banks'];
                    var balance = result['banking'];


                    $('.bank_repeat').remove();
                    $('#charts').append('<div class="bank_repeat" ' + banks + '" data-user-id="' + banks + '">' + banks + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '<span>' + balance.toFixed(2) + '</span>' + '</div>');


                })
        },


        onclick_invoice_this_year: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.selected');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }

            rpc.query({
                model: "account.move",
                method: "get_total_invoice_current_year",
                args: [posted],
            })
                .then(function (result) {

                    $('#total_supplier_invoice_paid').hide();
                    $('#total_supplier_invoice').hide();
                    $('#total_customer_invoice_paid').hide();
                    $('#total_customer_invoice').hide();
                    $('#tot_invoice').hide();
                    $('#tot_supplier_inv').hide();

                    $('#total_supplier_invoice_paid_current_month').hide();
                    $('#total_supplier_invoice_current_month').hide();
                    $('#total_customer_invoice_paid_current_month').hide();
                    $('#total_customer_invoice_current_month').hide();
                    $('#tot_invoice_current_month').hide();
                    $('#tot_supplier_inv_current_month').hide();


                    $('#total_supplier_invoice_paid_current_year').empty();
                    $('#total_supplier_invoice_current_year').empty();
                    $('#total_customer_invoice_paid_current_year').empty();
                    $('#total_customer_invoice_current_year').empty();
                    $('#tot_invoice_current_year').empty();
                    $('#tot_supplier_inv_current_year').empty();

                    $('#total_supplier_invoice_paid_current_year').show();
                    $('#total_supplier_invoice_current_year').show();
                    $('#total_customer_invoice_paid_current_year').show();
                    $('#total_customer_invoice_current_year').show();
                    $('#tot_invoice_current_year').show();
                    $('#tot_supplier_inv_current_year').show();
                    var tot_invoice_current_year = result[0][0]
                    var tot_credit_current_year = result[1][0]
                    var tot_supplier_inv_current_year = result[2][0]
                    var tot_supplier_refund_current_year = result[3][0]
                    var tot_customer_invoice_paid_current_year = result[4][0]
                    var tot_supplier_invoice_paid_current_year = result[5][0]
                    var tot_customer_credit_paid_current_year = result[6][0]
                    var tot_supplier_refund_paid_current_year = result[7][0]
                    var customer_invoice_total_current_year = (tot_invoice_current_year - tot_credit_current_year).toFixed(2)
                    var customer_invoice_paid_current_year = (tot_customer_invoice_paid_current_year - tot_customer_credit_paid_current_year).toFixed(2)
                    var invoice_percentage_current_year = ((customer_invoice_total_current_year / customer_invoice_paid_current_year) * 100).toFixed(2)
                    var supplier_invoice_total_current_year = (tot_supplier_inv_current_year - tot_supplier_refund_current_year).toFixed(2)
                    var supplier_invoice_paid_current_year = (tot_supplier_invoice_paid_current_year - tot_supplier_refund_paid_current_year).toFixed(2)
                    var supplier_percentage_current_year = ((supplier_invoice_total_current_year / supplier_invoice_paid_current_year) * 100).toFixed(2)

                    $('#tot_supplier_inv_current_year').attr("value", supplier_invoice_paid_current_year);
                    $('#tot_supplier_inv_current_year').attr("max", supplier_invoice_total_current_year);

                    $('#tot_invoice_current_year').attr("value", customer_invoice_paid_current_year);
                    $('#tot_invoice_current_year').attr("max", customer_invoice_total_current_year);

                    $('#total_customer_invoice_paid_current_year').append('<div class="logo">' + '<span>' + customer_invoice_paid_current_year + '</span><span>Total Pago<span></div>');
                    $('#total_customer_invoice_current_year').append('<div" class="logo">' + '<span>' + customer_invoice_total_current_year + '</span><span>Total Fatuas <span></div>');

                    $('#total_supplier_invoice_paid_current_year').append('<div" class="logo">' + '<span>' + supplier_invoice_paid_current_year + '</span><span>Total Pago<span></div>');
                    $('#total_supplier_invoice_current_year').append('<div" class="logo">' + '<span>' + supplier_invoice_total_current_year + '</span><span>Total Faturas<span></div>');

                })
        },
        onclick_invoice_this_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.selected');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: "account.move",
                method: "get_total_invoice_current_month",
                args: [posted],
            })
                .then(function (result) {

                    $('#total_supplier_invoice_paid').hide();
                    $('#total_supplier_invoice').hide();
                    $('#total_customer_invoice_paid').hide();
                    $('#total_customer_invoice').hide();
                    $('#tot_invoice').hide();
                    $('#tot_supplier_inv').hide();
                    $('#total_supplier_invoice_paid_current_month').empty();
                    $('#total_supplier_invoice_current_month').empty();
                    $('#total_customer_invoice_paid_current_month').empty();
                    $('#total_customer_invoice_current_month').empty();
                    $('#tot_invoice_current_month').empty();
                    $('#tot_supplier_inv_current_month').empty();
                    $('#total_supplier_invoice_paid_current_year').hide();
                    $('#total_supplier_invoice_current_year').hide();
                    $('#total_customer_invoice_paid_current_year').hide();
                    $('#total_customer_invoice_current_year').hide();
                    $('#tot_invoice_current_year').hide();
                    $('#tot_supplier_inv_current_year').hide();
                    $('#total_supplier_invoice_paid_current_month').show();
                    $('#total_supplier_invoice_current_month').show();
                    $('#total_customer_invoice_paid_current_month').show();
                    $('#total_customer_invoice_current_month').show();
                    $('#tot_invoice_current_month').show();
                    $('#tot_supplier_inv_current_month').show();
                    var tot_invoice_current_month = result[0][0]
                    var tot_credit_current_month = result[1][0]
                    var tot_supplier_inv_current_month = result[2][0]
                    var tot_supplier_refund_current_month = result[3][0]
                    var tot_customer_invoice_paid_current_month = result[4][0]
                    var tot_supplier_invoice_paid_current_month = result[5][0]
                    var tot_customer_credit_paid_current_month = result[6][0]
                    var tot_supplier_refund_paid_current_month = result[7][0]
                    var customer_invoice_total_current_month = (tot_invoice_current_month - tot_credit_current_month).toFixed(2)
                    var customer_invoice_paid_current_month = (tot_customer_invoice_paid_current_month - tot_customer_credit_paid_current_month).toFixed(2)
                    var invoice_percentage_current_month = ((customer_invoice_total_current_month / customer_invoice_paid_current_month) * 100).toFixed(2)
                    var supplier_invoice_total_current_month = (tot_supplier_inv_current_month - tot_supplier_refund_current_month).toFixed(2)
                    var supplier_invoice_paid_current_month = (tot_supplier_invoice_paid_current_month - tot_supplier_refund_paid_current_month).toFixed(2)
                    var supplier_percentage_current_month = ((supplier_invoice_total_current_month / supplier_invoice_paid_current_month) * 100).toFixed(2)

                    $('#tot_supplier_inv_current_month').attr("value", supplier_invoice_paid_current_month);
                    $('#tot_supplier_inv_current_month').attr("max", supplier_invoice_total_current_month);

                    $('#tot_invoice_current_month').attr("value", customer_invoice_paid_current_month);
                    $('#tot_invoice_current_month').attr("max", customer_invoice_total_current_month);

                    $('#total_customer_invoice_paid_current_month').append('<div class="logo">' + '<span>' + customer_invoice_paid_current_month + '</span><span>Total Pago<span></div>');
                    $('#total_customer_invoice_current_month').append('<div" class="logo">' + '<span>' + customer_invoice_total_current_month + '</span><span>Total Faturas<span></div>');

                    $('#total_supplier_invoice_paid_current_month').append('<div" class="logo">' + '<span>' + supplier_invoice_paid_current_month + '</span><span>Total Pago<span></div>');
                    $('#total_supplier_invoice_current_month').append('<div" class="logo">' + '<span>' + supplier_invoice_total_current_month + '</span><span>Total Faturas<span></div>');

                })
        },

        onclick_income_this_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.income');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_income_this_month',
                args: [posted],

            })
                .then(function (result) {


                    var ctx = document.getElementById("canvas").getContext('2d');

                    // Define the data
                    var income = result.income; // Add data values to array
                    var expense = result.expense;
                    var profit = result.profit;

                    var labels = result.date; // Add labels to array
                    // End Defining data

                    // End Defining data
                    if (window.myCharts != undefined)
                        window.myCharts.destroy();
                    window.myCharts = new Chart(ctx, {
                        //var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Receitas', // Name the series
                                data: income, // Specify the data values array
                                backgroundColor: '#66aecf',
                                borderColor: '#66aecf',

                                borderWidth: 1, // Specify bar border width
                                type: 'bar', // Set this data to a line chart
                                fill: false
                            },
                                {
                                    label: 'Despesas', // Name the series
                                    data: expense, // Specify the data values array
                                    backgroundColor: '#6993d6',
                                    borderColor: '#6993d6',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'bar', // Set this data to a line chart
                                    fill: false
                                },
                                {
                                    label: 'Receitas/Perdas', // Name the series
                                    data: profit, // Specify the data values array
                                    backgroundColor: '#0bd465',
                                    borderColor: '#0bd465',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'line', // Set this data to a line chart
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true, // Instruct chart js to respond nicely.
                            maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
                        }
                    });

                })
        },

        onclick_aged_recevable_pie_chart: function () {

            document.getElementById("aged_recevable_pie_chart").style.color = "gray";

            $('#aged_recevable_pie_chart').addClass("expense");

            rpc.query({
                model: "account.move",
                method: "get_latebills",
            })
                .then(function (result) {

                    $(document).ready(function () {
                        var options = {
                            // legend: false,
                            responsive: true,
                            legend: {
                                position: 'bottom'
                            }
                        };

                        if (window.donuts != undefined)
                            window.donuts.destroy();

                        window.donuts = new Chart($("#horizontalbarChart"), {
                            type: 'doughnut',
                            tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                            data: {
                                labels: result.bill_partner,
                                datasets: [{
                                    data: result.bill_amount,
                                    backgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ],
                                    hoverBackgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ]
                                }]
                            },
                            options: {
                                responsive: false
                            }
                        });
                    });


                })
        },
        onclick_in_ex_bar_chart: function (ev) {
            document.getElementById("in_ex_bar_chart").style.color = "gray";
            $('#in_ex_bar_chart').addClass("expense");
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }

            rpc.query({
                model: "account.move",
                method: "get_income_this_year",
                args: [posted],
            })
                .then(function (result) {


                    var ctx = document.getElementById("canvas").getContext('2d');

                    $('#net_profit_this_months').hide();
                    $('#net_profit_last_month').hide();
                    $('#net_profit_last_year').hide();
                    $('#net_profit_this_year').show();
                    // Define the data
                    var income = result.income; // Add data values to array
                    var expense = result.expense;
                    var profit = result.profit;

                    var labels = result.month; // Add labels to array
                    // End Defining data

                    // End Defining data
                    if (window.myCharts != undefined)
                        window.myCharts.destroy();
                    window.myCharts = new Chart(ctx, {
                        //var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Receitas', // Name the series
                                data: income, // Specify the data values array
                                backgroundColor: '#66aecf',
                                borderColor: '#66aecf',

                                borderWidth: 1, // Specify bar border width
                                type: 'bar', // Set this data to a line chart
                                fill: false
                            },
                                {
                                    label: 'Despesa', // Name the series
                                    data: expense, // Specify the data values array
                                    backgroundColor: '#6993d6',
                                    borderColor: '#6993d6',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'bar', // Set this data to a line chart
                                    fill: false
                                },
                                {
                                    label: 'Receitas/Perdas', // Name the series
                                    data: profit, // Specify the data values array
                                    backgroundColor: '#0bd465',
                                    borderColor: '#0bd465',

                                    borderWidth: 1, // Specify bar border width
                                    type: 'line', // Set this data to a line chart
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true, // Instruct chart js to respond nicely.
                            maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
                        }
                    });


                })
        },
        onclick_aged_payable_this_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.expense');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_overdues_this_month',
                args: [posted],
            })
                .then(function (result) {

                    // Doughnut Chart
                    $(document).ready(function () {
                        var options = {
                            // legend: false,
                            responsive: false
                        };
                        if (window.donut != undefined)
                            window.donut.destroy();


                        window.donut = new Chart($("#canvas1"), {
                            type: 'doughnut',
                            tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                            data: {
                                labels: result.due_partner,
                                datasets: [{
                                    data: result.due_amount,
                                    backgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ],
                                    hoverBackgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ]
                                }]
                            },
                            options: {
                                responsive: false
                            }
                        });
                    });
                    // Doughnut Chart

                })
        },
        onclick_total_aged_payable: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.expense');
            var data = $(selected[0]).data();

            rpc.query({
                model: 'account.move',
                method: 'get_overdues',
            })
                .then(function (result) {
                    // Doughnut Chart
                    $(document).ready(function () {
                        var options = {
                            // legend: false,
                            responsive: false
                        };


                        if (window.donut != undefined)
                            window.donut.destroy();


                        window.donut = new Chart($("#canvas1"), {
                            type: 'doughnut',
                            tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                            data: {
                                labels: result.due_partner,
                                datasets: [{
                                    data: result.due_amount,
                                    backgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ],
                                    hoverBackgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ]
                                }]
                            },
                            options: {
                                responsive: false
                            }
                        });
                    });
                })

        },
        onclick_aged_payable_this_year: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.expense');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_overdues_this_year',
                args: [posted],
            })
                .then(function (result) {
                    // Doughnut Chart
                    $(document).ready(function () {
                        var options = {
                            // legend: false,
                            responsive: false
                        };
                        if (window.donut != undefined)
                            window.donut.destroy();


                        window.donut = new Chart($("#canvas1"), {
                            type: 'doughnut',
                            tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                            data: {
                                labels: result.due_partner,
                                datasets: [{
                                    data: result.due_amount,
                                    backgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ],
                                    hoverBackgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ]
                                }]
                            },
                            options: {
                                responsive: false
                            }
                        });
                    });
                    // Doughnut Chart
                })
        },
        onclick_aged_receivable_this_year: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.expense');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_latebills_this_year',
                args: [posted],
            })
                .then(function (result) {

                    $(document).ready(function () {
                        var options = {
                            // legend: false,
                            responsive: true,
                            legend: {
                                position: 'bottom'
                            }
                        };


                        if (window.donuts != undefined)
                            window.donuts.destroy();


                        window.donuts = new Chart($("#horizontalbarChart"), {
                            type: 'doughnut',
                            tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                            data: {
                                labels: result.bill_partner,
                                datasets: [{
                                    data: result.bill_amount,
                                    backgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ],
                                    hoverBackgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ]
                                }]
                            },
                            options: {
                                responsive: false
                            }
                        });
                    });


                })
        },

        onclick_aged_receivable_this_month: function (ev) {
            ev.preventDefault();
            var selected = $('.btn.btn-tool.expense');
            var data = $(selected[0]).data();
            var posted = false;
            if ($('#toggle-two')[0].checked == true) {
                posted = "posted"
            }
            rpc.query({
                model: 'account.move',
                method: 'get_latebills_this_month',
                args: [posted],

            })
                .then(function (result) {
                    function myFunction() {
                        document.getElementByClass("btn btn-tool dropdown-toggle").text
                        document.getElementById("aged_receivable_this_month").text
                    }

                    $(document).ready(function () {
                        var options = {
                            // legend: false,
                            responsive: true,
                            legend: {
                                position: 'bottom'
                            }
                        };


                        if (window.donuts != undefined)
                            window.donuts.destroy();


                        window.donuts = new Chart($("#horizontalbarChart"), {
                            type: 'doughnut',
                            tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                            data: {
                                labels: result.bill_partner,
                                datasets: [{
                                    data: result.bill_amount,
                                    backgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ],
                                    hoverBackgroundColor: [
                                        '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                        '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                        '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                        ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                        '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                        '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                        '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                        '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                        '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                        '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                    ]
                                }]
                            },
                            options: {
                                responsive: false
                            }
                        });
                    });


                })
        },
        renderElement: function (ev) {
            $.when(this._super())
                .then(function (ev) {


                    $('#toggle-two').bootstrapToggle({
                        on: 'Ver todos os lançamentos',
                        off: 'Ver apenas lançamentos postados'
                    });


                    var posted = false;
                    if ($('#toggle-two')[0].checked == true) {
                        posted = "posted"
                    }


                    rpc.query({
                        model: "account.move",
                        method: "get_currency",
                    })
                        .then(function (result) {
                            currency = result;

                        })


                    rpc.query({
                        model: "account.move",
                        method: "get_income_this_month",
                        args: [posted],
                    })
                        .then(function (result) {


                            var ctx = document.getElementById("canvas").getContext('2d');

                            // Define the data
                            var income = result.income; // Add data values to array
                            var expense = result.expense;
                            var profit = result.profit;

                            var labels = result.date; // Add labels to array
                            // End Defining data

                            // End Defining data
                            if (window.myCharts != undefined)
                                window.myCharts.destroy();
                            window.myCharts = new Chart(ctx, {
                                //var myChart = new Chart(ctx, {
                                type: 'bar',
                                data: {
                                    labels: labels,
                                    datasets: [{
                                        label: 'Receitas', // Name the series
                                        data: income, // Specify the data values array
                                        backgroundColor: '#66aecf',
                                        borderColor: '#66aecf',

                                        borderWidth: 1, // Specify bar border width
                                        type: 'bar', // Set this data to a line chart
                                        fill: false
                                    },
                                        {
                                            label: 'Despesas', // Name the series
                                            data: expense, // Specify the data values array
                                            backgroundColor: '#6993d6',
                                            borderColor: '#6993d6',

                                            borderWidth: 1, // Specify bar border width
                                            type: 'bar', // Set this data to a line chart
                                            fill: false
                                        },
                                        {
                                            label: 'Lucro/Prejuízo', // Name the series
                                            data: profit, // Specify the data values array
                                            backgroundColor: '#0bd465',
                                            borderColor: '#0bd465',

                                            borderWidth: 1, // Specify bar border width
                                            type: 'line', // Set this data to a line chart
                                            fill: false
                                        }
                                    ]
                                },
                                options: {
                                    responsive: true, // Instruct chart js to respond nicely.
                                    maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
                                }
                            });

                        })

                    rpc.query({
                        model: 'account.move',
                        method: 'get_overdues_this_month',
                        args: [posted],
                    }).then(function (result) {

                            //
                        })
                    rpc.query({
                        model: 'account.move',
                        method: 'get_overdues_this_month',
                        args: [posted],
                    })
                        .then(function (result) {
                            // Doughnut Chart
                            $(document).ready(function () {
                                var options = {
                                    // legend: false,
                                    responsive: true,
                                    legend: {
                                        position: 'bottom'
                                    }
                                };
                                if (window.donut != undefined)
                                    window.donut.destroy();
                                window.donut = new Chart($("#canvas1"), {
                                    type: 'doughnut',
                                    tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                                    data: {
                                        labels: result.due_partner,
                                        datasets: [{
                                            data: result.due_amount,
                                            backgroundColor: [
                                                '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                                '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                                '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                                ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                                '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                                '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                                '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                                '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                                '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                                '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                            ],
                                            hoverBackgroundColor: [
                                                '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                                '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                                '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                                ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                                '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                                '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                                '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                                '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                                '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                                '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                            ]
                                        }]
                                    },
                                    options: {
                                        responsive: false
                                    }
                                });
                            });
                        })
                    rpc.query({
                        model: "account.move",
                        method: "get_total_invoice_current_month",
                        args: [posted],
                    }).then(function (result) {

                            $('#total_supplier_invoice_paid').hide();
                            $('#total_supplier_invoice').hide();
                            $('#total_customer_invoice_paid').hide();
                            $('#total_customer_invoice').hide();
                            $('#tot_invoice').hide();
                            $('#tot_supplier_inv').hide();

                            $('#total_supplier_invoice_paid_current_month').empty();
                            $('#total_supplier_invoice_current_month').empty();
                            $('#total_customer_invoice_paid_current_month').empty();
                            $('#total_customer_invoice_current_month').empty();
                            $('#tot_invoice_current_month').empty();
                            $('#tot_supplier_inv_current_month').empty();

                            $('#total_supplier_invoice_paid_current_year').hide();
                            $('#total_supplier_invoice_current_year').hide();
                            $('#total_customer_invoice_paid_current_year').hide();
                            $('#total_customer_invoice_current_year').hide();
                            $('#tot_invoice_current_year').hide();
                            $('#tot_supplier_inv_current_year').hide();


                            $('#total_supplier_invoice_paid_current_month').show();
                            $('#total_supplier_invoice_current_month').show();
                            $('#total_customer_invoice_paid_current_month').show();
                            $('#total_customer_invoice_current_month').show();
                            $('#tot_invoice_current_month').show();
                            $('#tot_supplier_inv_current_month').show();


                            var tot_invoice_current_month = result[0][0]
                            var tot_credit_current_month = result[1][0]
                            var tot_supplier_inv_current_month = result[2][0]
                            var tot_supplier_refund_current_month = result[3][0]
                            var tot_customer_invoice_paid_current_month = result[4][0]
                            var tot_supplier_invoice_paid_current_month = result[5][0]
                            var tot_customer_credit_paid_current_month = result[6][0]
                            var tot_supplier_refund_paid_current_month = result[7][0]
                            var customer_invoice_total_current_month = (tot_invoice_current_month - tot_credit_current_month).toFixed(2)
                            var customer_invoice_paid_current_month = (tot_customer_invoice_paid_current_month - tot_customer_credit_paid_current_month).toFixed(2)
                            var invoice_percentage_current_month = ((customer_invoice_total_current_month / customer_invoice_paid_current_month) * 100).toFixed(2)
                            var supplier_invoice_total_current_month = (tot_supplier_inv_current_month - tot_supplier_refund_current_month).toFixed(2)
                            var supplier_invoice_paid_current_month = (tot_supplier_invoice_paid_current_month - tot_supplier_refund_paid_current_month).toFixed(2)
                            var supplier_percentage_current_month = ((supplier_invoice_total_current_month / supplier_invoice_paid_current_month) * 100).toFixed(2)

                            $('#tot_supplier_inv_current_month').attr("value", supplier_invoice_paid_current_month);
                            $('#tot_supplier_inv_current_month').attr("max", supplier_invoice_total_current_month);

                            $('#tot_invoice_current_month').attr("value", customer_invoice_paid_current_month);
                            $('#tot_invoice_current_month').attr("max", customer_invoice_total_current_month);

                            $('#total_customer_invoice_paid_current_month').append('<div class="logo">' + '<span>' + customer_invoice_paid_current_month + '</span><span>Total Pago<span></div>');
                            $('#total_customer_invoice_current_month').append('<div" class="logo">' + '<span>' + customer_invoice_total_current_month + '</span><span>Total Faturas<span></div>');

                            $('#total_supplier_invoice_paid_current_month').append('<div" class="logo">' + '<span>' + supplier_invoice_paid_current_month + '</span><span>Total Pago<span></div>');
                            $('#total_supplier_invoice_current_month').append('<div" class="logo">' + '<span>' + supplier_invoice_total_current_month + '</span><span>Total Faturas<span></div>');

                        })
                    rpc.query({
                        model: 'account.move',
                        method: 'get_latebills_this_month',
                        args: [posted],
                    })
                        .then(function (result) {

                            $(document).ready(function () {
                                var options = {
                                    // legend: false,
                                    responsive: true,
                                    legend: {
                                        position: 'bottom'
                                    }
                                };
                                if (window.donuts != undefined)
                                    window.donuts.destroy();
                                window.donuts = new Chart($("#horizontalbarChart"), {
                                    type: 'doughnut',
                                    tooltipFillColor: "rgba(51, 51, 51, 0.55)",
                                    data: {
                                        labels: result.bill_partner,
                                        datasets: [{
                                            data: result.bill_amount,
                                            backgroundColor: [
                                                '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                                '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                                '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                                ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                                '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                                '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                                '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                                '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                                '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                                '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                            ],
                                            hoverBackgroundColor: [
                                                '#66aecf ', '#6993d6 ', '#666fcf', '#7c66cf', '#9c66cf',
                                                '#bc66cf ', '#b75fcc', ' #cb5fbf ', ' #cc5f7f ', ' #cc6260',
                                                '#cc815f', '#cca15f ', '#ccc25f', '#b9cf66', '#99cf66',
                                                ' #75cb5f ', '#60cc6c', '#804D8000', '#80B33300', '#80CC80CC', '#f2552c', '#00cccc',
                                                '#1f2e2e', '#993333', '#00cca3', '#1a1a00', '#3399ff',
                                                '#8066664D', '#80991AFF', '#808E666FF', '#804DB3FF', '#801AB399',
                                                '#80E666B3', '#8033991A', '#80CC9999', '#80B3B31A', '#8000E680',
                                                '#804D8066', '#80809980', '#80E6FF80', '#801AFF33', '#80999933',
                                                '#80FF3380', '#80CCCC00', '#8066E64D', '#804D80CC', '#809900B3',
                                                '#80E64D66', '#804DB380', '#80FF4D4D', '#8099E6E6', '#806666FF'
                                            ]
                                        }]
                                    },
                                    options: {
                                        responsive: false
                                    }
                                });
                            });
                        })
                    rpc.query({
                        model: "account.move",
                        method: "get_overdues",

                    }).then(function (result) {
                            var due_count = 0;
                            _.forEach(result, function (x) {
                                due_count++;
                                $('#overdues').append('<li><a class="overdue_line_cust" href="#" id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + x.due_partner + '</a>' + '&nbsp;&nbsp;&nbsp;&nbsp;' + '<span>' + x.due_amount + ' ' + currency + '</span>' + '</li>');

                                //                                $('#overdues_amounts').append('<li><a class="overdue_line_cust" href="#" id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + x.amount + '</a>' + '<span>'+' '+currency+ '</span>' + '</li>' );

                            });

                            $('#due_count').append('<span class="badge badge-danger">' + due_count + ' Due(s)</span>');
                        })
                    rpc.query({
                        model: "account.move",
                        method: "get_top_10_customers",
                        args: [posted]
                    }).then(function (result) {
                            var due_count = 0;
                            _.forEach(result, function (x) {

                                $('#top_10_customers').show();
                                $('#top_10_customers_this_month').hide();
                                due_count++;
                                $('#top_10_customers').append('<li><div id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + x.customers + '</div>' + '<div id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + currency + ' ' + x.amount.toFixed(2) + '</div>' + '</li>');

                            });
                        })
                    rpc.query({
                        model: "account.move",
                        method: "bank_balance",
                        args: [posted]
                    })
                        .then(function (result) {
                            var banks = result['banks'];
                            var balance = result['banking'];
                            for (var k = 0; k < banks.length; k++) {
                                //                                $('#charts').append('<li><a ' + banks[k] + '" data-user-id="' + banks[k] + '">' + banks[k] + '</a>'+  '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '<span>'+ balance[k] +'</span>' + '</li>' );
                                $('#current_bank_balance').append('<li><div>' + banks[k] + '</div><div>' + currency + '&nbsp;' + balance[k].toFixed(2) + '</div></li>');
                                //                                $('#current_bank_balance').append('<li>' + banks[k] +'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+ balance[k] +  '</li>' );
                                $('#drop_charts_balance').append('<li>' + balance[k].toFixed(2) + '</li>');
                            }
                        })

                    rpc.query({
                        model: "account.move",
                        method: "get_latebills",

                    }).then(function (result) {
                            var late_count = 0;

                            _.forEach(result, function (x) {
                                late_count++;
                                $('#latebills').append('<li><a class="overdue_line_cust" href="#" id="line_' + x.parent + '" data-user-id="' + x.parent + '">' + x.partner + '<span>' + currency + ' ' + x.amount + '</span>' + '</a>' + '</li>');
                            });
                            $('#late_count').append('<span class="badge badge-danger">' + late_count + ' Late(s)</span>');
                        })
                    rpc.query({
                        model: "account.move",
                        method: "get_total_invoice",
                    })
                        .then(function (result) {
                            var total_invoice = result[0].sum;
                            total_invoice = total_invoice
                            $('#total_invoice').append('<span>' + total_invoice + ' ' + currency + '</span> ')
                        })
                    rpc.query({
                        model: "account.move",
                        method: "get_total_invoice_this_month",
                        args: [posted],
                    })
                        .then(function (result) {
                            var invoice_this_month = result[0].sum;
                            if (invoice_this_month) {
                                var total_invoices_this_month = invoice_this_month.toFixed(2)
                                $('#total_invoices_').append('<span>' + currency + ' ' + total_invoices_this_month + '</span> <div class="title">Este mês</div>')
                            }
                        })

                    rpc.query({
                        model: "account.move",
                        method: "get_total_invoice_last_month",
                    })
                        .then(function (result) {
                            var invoice_last_month = result[0].sum;
                            var total_invoices_last_month = invoice_last_month
                            $('#total_invoices_last').append('<span>' + total_invoices_last_month + ' ' + currency + '</span><div class="title">Last month</div>')
                        })

                    rpc.query({
                        model: "account.move",
                        method: "unreconcile_items"
                    })
                        .then(function (result) {

                            var unreconciled_count = result[0].count;

                            $('#unreconciled_items').append('<span>' + unreconciled_count + ' Item(s)</a></span> ')
                        })
                    rpc.query({
                        model: "account.move",
                        method: "unreconcile_items_this_month",
                        args: [posted],
                    })
                        .then(function (result) {
                            var unreconciled_counts_ = result[0].count;
                            $('#unreconciled_items_').append('<span>' + unreconciled_counts_ + ' Item(s)</span><div class="title">Este mês</div>')
                        })
                    rpc.query({
                        model: "account.move",
                        method: "unreconcile_items_this_year",
                        args: [posted],
                    })
                        .then(function (result) {
                            var unreconciled_counts_this_year = result[0].count;
                            $('#unreconciled_counts_this_year').append('<span>' + unreconciled_counts_this_year + '  Item(s)</span><div class="title">Este Ano</div>')
                        })

                    rpc.query({
                        model: "account.move",
                        method: "unreconcile_items_last_year"
                    })
                        .then(function (result) {
                            var unreconciled_counts_last_year = result[0].count;

                            $('#unreconciled_counts_last_year').append('<span>' + unreconciled_counts_last_year + '  Item(s)</span><div class="title">Last Year</div>')

                        })
                    rpc.query({
                        model: "account.move",
                        method: "month_income"
                    })
                        .then(function (result) {
                            var income = result[0].debit - result[0].credit;
                            income = -income;

                            $('#total_income').append('<span>' + income.toFixed(2) + ' ' + currency + '</span>')
                        })
                    rpc.query({
                        model: "account.move",
                        method: "month_income_this_month",
                        args: [posted],
                    })
                        .then(function (result) {
                            var incomes_ = result[0].debit - result[0].credit;
                            if (incomes_) {
                                incomes_ = -incomes_.toFixed(2);

                                $('#total_incomes_').append('<span>' + currency + ' ' + incomes_.toFixed(2) + '</span><div class="title">Este mês</div>')

                            } else {
                                incomes_ = -incomes_.toFixed(2);
                                $('#total_incomes_').append('<span>' + currency + ' ' + 0.0 + '</span><div class="title">Este mês</div>')
                            }
                        })

                    rpc.query({
                        model: "account.move",
                        method: "month_income_last_month"
                    })
                        .then(function (result) {
                            var incomes_last = result[0].debit - result[0].credit;
                            incomes_last = -incomes_last;

                            $('#total_incomes_last').append('<span>' + incomes_last + ' ' + currency + '</span><div class="title">Last month</div>')
                        })

                    rpc.query({
                        model: "account.move",
                        method: "month_expense"
                    })
                        .then(function (result) {
                            var expense = result[0].debit - result[0].credit;
                            var expenses = expense.toFixed()
                            $('#total_expense').append('<span>' + expenses + ' ' + currency + '</span>')
                        })
                    rpc.query({
                        model: "account.move",
                        method: "month_expense_this_month",
                        args: [posted],
                    }).then(function (result) {
                            var expense_this_month = result[0].debit - result[0].credit;
                            if (expense_this_month) {

                                var expenses_this_month_ = expense_this_month.toFixed(2)
                                $('#total_expenses_').append('<span>' + currency + ' ' + expenses_this_month_ + '</span><div class="title">Este mês</div>')
                            } else {
                                var expenses_this_month_ = expense_this_month.toFixed(2)
                                $('#total_expenses_').append('<span>' + currency + ' ' + 0.0 + '</span><div class="title">Este mês</div>')

                            }
                        })
                    rpc.query({
                        model: "account.move",
                        method: "month_expense_this_year",
                        args: [posted],
                    }).then(function (result) {
                            var expense_this_year = result[0].debit - result[0].credit;
                            if (expense_this_year) {

                                var expenses_this_year_ = expense_this_year.toFixed(2)

                                $('#total_expense_this_year').append('<span >' +  currency + ' ' + expenses_this_year_ + '</span><div class="title">Este ano</div>')
                            } else {
                                var expenses_this_year_ = expense_this_year.toFixed(2)

                                $('#total_expense_this_year').append('<span >' + currency+ ' ' + 0.0 + '</span><div class="title">Este ano</div>')
                            }
                        })
                    rpc.query({
                        model: "account.move",
                        method: "month_income_last_year"
                    })
                        .then(function (result) {
                            var incomes_last_year = result[0].debit - result[0].credit;
                            incomes_last_year = -incomes_last_year

                            $('#total_incomes_last_year').append('<span>' + incomes_last_year + '' + currency + '</span><div class="title">Last Year</div>')
                        })
                    rpc.query({
                        model: "account.move",
                        method: "month_income_this_year",
                        args: [posted],
                    })
                        .then(function (result) {
                            var incomes_this_year = result[0].debit - result[0].credit;
                            if (incomes_this_year) {

                                incomes_this_year = -incomes_this_year.toFixed(2);

                                $('#total_incomes_this_year').append('<span>' + currency + ' ' + incomes_this_year.toFixed(2) + '</span><div class="title">Este ano</div>')
                            } else {
                                incomes_this_year = -incomes_this_year.toFixed(2);
                                $('#total_incomes_this_year').append('<span>' + currency + '' + 0.0 + '</span><div class="title">Este ano</div>')
                            }

                        })

                    rpc.query({
                        model: "account.move",
                        method: "profit_income_this_month",
                        args: [posted],
                    }).then(function (result) {
                            var net_profit = true
                            if (result[1] == undefined) {
                                result[1] = 0;
                                if ((result[0]) > (result[1])) {
                                    net_profit = result[1] - result[0]
                                }

                            }

                            if (result[0] == undefined) {

                                result[0] = 0;
                            }

                            if ((-result[1]) > (result[0])) {
                                net_profit = -result[1] - result[0]
                            } else if ((result[1]) > (result[0])) {
                                net_profit = -result[1] - result[0]
                            } else {
                                net_profit = -result[1] - result[0]
                            }
                            var profit_this_months = net_profit;
                            if (profit_this_months) {
                                var net_profit_this_months = profit_this_months.toFixed(2)
                                $('#net_profit_this_months').empty();
                                $('#net_profit_this_months').append('<div class="title">Net Profit/Loss &nbsp;&nbsp;&nbsp;</div><span>' + net_profit_this_months + ' ' + currency + '</span>')
                                $('#net_profit_current_months').append('<span>' + currency + ' ' + net_profit_this_months + '</span> <div class="title">Este mês</div>')

                            } else {
                                var net_profit_this_months = profit_this_months.toFixed(2)
                                $('#net_profit_this_months').empty();
                                $('#net_profit_this_months').append('<div class="title">Net Profit/Loss &nbsp;&nbsp;&nbsp;</div><span>' + 0.0 + ' ' + currency + '</span>')
                                $('#net_profit_current_months').append('<span>' + currency + ' ' + 0.0 + '</span> <div class="title">Este mês</div>')
                            }
                        })

                    rpc.query({
                        model: "account.move",
                        method: "profit_income_this_year",
                        args: [posted],
                    })
                        .then(function (result) {
                            var net_profit = true


                            if (result[1] == undefined) {
                                result[1] = 0;
                                if ((result[0]) > (result[1])) {
                                    net_profit = result[1] - result[0]
                                }

                            }

                            if (result[0] == undefined) {

                                result[0] = 0;
                            }

                            if ((-result[1]) > (result[0])) {
                                net_profit = -result[1] - result[0]
                            } else if ((result[1]) > (result[0])) {
                                net_profit = -result[1] - result[0]
                            } else {
                                net_profit = -result[1] - result[0]
                            }


                            var profit_this_year = net_profit;
                            if (profit_this_year) {
                                var net_profit_this_year = profit_this_year.toFixed(2)
                                $('#net_profit_this_year').empty();
                                $('#net_profit_this_year').append('<div class="title">Receita Líquida/Prejuízo &nbsp;&nbsp;&nbsp;</div><span>' + net_profit_this_year + ' ' + currency + '</span>')
                                $('#net_profit_current_year').append('<span>' + currency + ' ' + net_profit_this_year + '</span> <div class="title">Este ano</div>')
                            } else {
                                var net_profit_this_year = profit_this_year.toFixed(2)
                                $('#net_profit_this_year').empty();
                                $('#net_profit_this_year').append('<div class="title">Receita Líquida/Prejuízo &nbsp;&nbsp;&nbsp;</div><span>' + 0.0 + ' ' + currency + '</span>')
                                $('#net_profit_current_year').append('<span>' + currency + ' ' + 0.0 + '</span> <div class="title">Este ano</div>')

                            }
                        })
                });
        },
        willStart: function () {
            var self = this;
            self.drpdn_show = false;
            return Promise.all([ajax.loadLibs(this), this._super()]);
        },
    });
    core.action_registry.add('invoice_dashboard', ActionMenu);

});