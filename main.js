const botBuilder = require('claudia-bot-builder')
const natural = require('natural')

try {
  const botFunctions = require('./bot_functions')
} catch(e) {
  console.log('Error importing local files- ', e)
}

const order_question = ['What would you like to order?','Type your order in the following format- \nex. 1 case of Hieneiken, 2 kegs of Black Isle yellohammer']

module.exports = botBuilder(request => {

  try{
    if (request.text == 'hi') {
      return order_question
    }
    else {
      const tokenizer = new natural.RegexpTokenizer({pattern: /\,/});
      var orders = request.text
      var token_orders = tokenizer.tokenize(orders)
      console.log('token_orders', token_orders)
      return botFunctions.fetchProducts()
          .then(products => {
            console.log('products', products)
            var parsedOrders = []
            token_orders.forEach(parsed => {
              console.log('parsed', parsed)
              var q = botFunctions.findQuantity(parsed)
              console.log('quantity', q[0])
              var u = botFunctions.findUnits(q[1])
              console.log('units', u[0])
              var p = botFunctions.findProducts(products, u[1])

              var order = {
                quantity : q[0],
                unit : u[0],
                products: p[0]
              }

              parsedOrders.push(order)

            })

            console.log('Parsed Orders', JSON.stringify(parsedOrders, null, 4))
            return JSON.stringify(parsedOrders, null, 4)

          })

    }
  } catch(e){
    console.log('Error during processing- ', e)
  }


});
