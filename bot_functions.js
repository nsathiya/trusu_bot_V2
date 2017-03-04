const natural = require('natural')
//const prompt = require('souffleur');
const rp = require('minimal-request-promise')

const order_question = 'What products do you want to order? \nType your order in the following format- \nex. 1 case of Hieneiken, 2 kegs of Black Isle yellohammer'
const UNITS = ['unit', 'case', 'box','pallet','crate', 'keg', 'bottle']
const PRODUCT_SCORE_THRESHOLD = 0.80
const SUPPLIEREMAIL ='shaheen@bestbevhk.com'

const findQuantity = (order) => {

  console.log('\n QUANTITY IDENTIFIER: \n')
  console.log('-------------------------------')
  console.log('Quantity: ' + order.match(/\d+/))


  return [order.match(/\d+/)[0], order.replace(order.match(/\d+/)[0], '')]
}

const findUnits = (order) => {
  const tokenizer = new natural.RegexpTokenizer({pattern: / /});
  const token_order = tokenizer.tokenize(order)
  var act_unit = tokenizer.tokenize(order)[0]
  var max_est = 0
  var est_unit = ''

  console.log('\n JAROWINKLER UNIT SCORES: \n')
  console.log('Inputted Word: ', act_unit)
  console.log('-------------------------------')

  UNITS.forEach(u => {
    var score = natural.JaroWinklerDistance(act_unit.toUpperCase(), u.toUpperCase())
    console.log('Score for ' + u + ': ' + score)
    if ( score > max_est ){
      max_est = score
      est_unit = u
    }
  })

  if (max_est < 0.5)
    console.log('Something is wrong. Throw error')
    //THROW error

  return [est_unit, order.replace(act_unit, '')]

}

const fetchProducts = () => {
  return new Promise((fulfill, reject) => {
    rp.get('https://trusu.co/collectionapi/products')
        .then((res) => {
          var prods = JSON.parse(res.body)
          console.log('prods', prods)
          var f_prods = prods.filter( prod => {
            return prod.supplierEmail == SUPPLIEREMAIL
          })
          fulfill(f_prods)
        })
        .catch(error => reject(error))
      })
}

const findProducts = (prods, order) => {

  var act_prod = order.replace(order.match(/\of/), '')
  var est_prods_jarodWinkler = []
  var est_prods_regexMatch = []

  console.log('\n JAROWINKLER PRODUCT SCORES: \n')
  console.log('Inputted Word: ', act_prod.trim())
  console.log('-------------------------------')

  prods.forEach(p => {
    //var score = natural.JaroWinklerDistance(act_prod.toUpperCase().trim(), p.title.toUpperCase())
    var score = natural.JaroWinklerDistance(p.title.toUpperCase(), act_prod.toUpperCase().trim())
    console.log('Score for ' + p.title + ': ' + score)
    if ( score > PRODUCT_SCORE_THRESHOLD ){
      est_prods_jarodWinkler.push({
        _id: p._id,
        title: p.title,
        score: score
      })
    }
  })

  console.log('\n REGEX MATCH PRODUCT SCORES: \n')
  console.log('Inputted Word: ' + act_prod.trim())
  console.log('-------------------------------')

  prods.forEach(p => {
    var match = p.title.toUpperCase().match(act_prod.toUpperCase().trim())
    console.log('Score for ' + p.title + ': ' + (match ? 1 : 0))

    if ( match ){
      est_prods_regexMatch.push({
        _id: p._id,
        title: p.title
      })
    }
  })

  console.log('\n REGEX INDIVIDUALIZED MATCH PRODUCT SCORES: \n')
  console.log('Inputted Word: ' + act_prod.trim())
  console.log('-------------------------------')

  var est_prods_regexMatch_JaroWinkler = []
  const tokenizer = new natural.RegexpTokenizer({pattern: / /});
  const act_prod_tokenized = tokenizer.tokenize(act_prod.toUpperCase().trim())
  prods.forEach(p => {
    var db_prod_tokenized = tokenizer.tokenize(p.title.toUpperCase().trim())
    var t = act_prod_tokenized.length
    var i = 0;
    for (var a in act_prod_tokenized)
      for (var d in db_prod_tokenized)
        {
          var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
          if (!format.test(db_prod_tokenized[d]))
            if (natural.JaroWinklerDistance(db_prod_tokenized[d], act_prod_tokenized[a]) > PRODUCT_SCORE_THRESHOLD) //if(act_prod_tokenized[a].match(db_prod_tokenized[d]))
              i++
        }
    var score = (i/t)
    console.log('Score for ' + p.title + ': ' + score)

    if ( score == 1){
      est_prods_regexMatch_JaroWinkler.push({
        _id: p._id,
        title: p.title,
        score: score
      })
    }
  })

  var est_prods = {
    'JaroWinklerDistance': est_prods_jarodWinkler,
    'RegexMatch': est_prods_regexMatch,
    'SathiyaSpiceAlg': est_prods_regexMatch_JaroWinkler
  }

  return [est_prods, act_prod]
}

// SAMPLE USAGE
//
// const getEntry = () => {
//   return Promise.resolve()
//   .then(() => {
//
//     return prompt([order_question]);
//
//   })
//   .then(result => {
//
//     const tokenizer = new natural.RegexpTokenizer({pattern: /\,/});
//     var orders = result[order_question]
//     //console.log (tokenizer.tokenize(orders))
//     var token_orders = tokenizer.tokenize(orders)
//     return token_orders
//
//   })
//   .then(token_orders => {
//
//     console.log('\n PROCESS REPORT: \n')
//     console.log('-------------------------------')
//
//     fetchProducts()
//     .then(products => {
//       var parsedOrders = []
//       token_orders.forEach(parsed => {
//
//         var [q, parsedq] = findQuantity(parsed)
//         var [u, parsedu] = findUnits(parsedq)
//         var [p, parsedp] = findProducts(products, parsedu)
//
//         var order = {
//           quantity : q,
//           unit : u,
//           products: p
//         }
//         parsedOrders.push(order)
//       })
//       console.log('Parsed Orders', JSON.stringify(parsedOrders, null, 4))
//     })
//   })
// }

module.exports.findQuantity = findQuantity;
module.exports.findUnits = findUnits
module.exports.findProducts = findProducts
module.exports.fetchProducts = fetchProducts;
