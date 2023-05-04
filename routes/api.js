"use strict";
const axios = require("axios");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
let obj = [];

const ipSchema = new Schema({
  ip: String,
  stock: String,
  likes: {
    type: Number,
    default: 0,
  },
});

const ip = mongoose.model("ip", ipSchema);

module.exports = async function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;
    const hisIp = req.ip;

    
    if (Array.isArray(stock)) {
      const first = stock[0];
      const second = stock[1];
     
      const response = await axios.get(
        `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${first}/quote`
      );

      const data1 = response.data;

      const response2 = await axios.get(
        `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${second}/quote`
      );
      const data2 = response2.data;

      if (like == "true") {
        ip.findOne({ $and: [{ ip: hisIp }, { stock: data1.symbol }] })
          .then((result) => {
            if (result) {
            } else {
              const temp = new ip({
                ip: hisIp,
                stock: data1.symbol,
                likes: 1,
              });
              temp.save();
              if (typeof obj[data1.symbol] == "undefined") {
                obj[data1.symbol] = 1;
              } else {
                obj[data1.symbol]++;
              }
            }

            ip.findOne({ $and: [{ ip: hisIp }, { stock: data2.symbol }] })
              .then((result) => {
                if (result) {
                } else {
                  const temp = new ip({
                    ip: hisIp,
                    stock: data2.symbol,
                    likes: 1,
                  });
                  temp.save();
                  if (typeof obj[data2.symbol] == "undefined") {
                    obj[data2.symbol] = 1;
                  } else {
                    obj[data2.symbol]++;
                  }
                }
               
                const stockData1 = [
                  {
                    stock: data2.symbol,
                    price: data2.iexRealtimePrice,
                    rel_likes: obj[data2.symbol] - obj[data1.symbol],
                  },
                  {
                    stock: data1.symbol,
                    price: data1.iexRealtimePrice,
                    rel_likes: obj[data1.symbol] - obj[data2.symbol],
                  },
                ];

                res.json({ stockData: stockData1 });
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        const stockData1 = [
          {
            stock: data2.symbol,
            price: data2.iexRealtimePrice,
            rel_likes: (obj[data2.symbol] || 0) - (obj[data1.symbol] || 0),
          },
          {
            stock: data1.symbol,
            price: data1.iexRealtimePrice,
            rel_likes: (obj[data1.symbol] || 0) - (obj[data2.symbol] || 0),
          },
        ];
        

        res.json({ stockData: stockData1 });
      }
    } else {
      const response = await axios.get(
        `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
      );
      const data = response.data;

      const stockData = {
        stock: data.symbol,
        price: data.iexRealtimePrice,
        likes: 0,
      };

      if (like == "true") {
        ip.findOne({ $and: [{ ip: hisIp }, { stock: data.symbol }] })
          .then((result) => {
            if (result) {
              stockData.likes = (obj[data.symbol] || 1);
              console.log(obj);
              res.json({
                stockData: stockData,
              });
            } else {
              const temp = new ip({
                ip: hisIp,
                stock: data.symbol,
                likes: 1,
              });
              temp.save();

              
              if (typeof obj[data.symbol] == "undefined") {
                obj[data.symbol] = 1;
              } else {
                obj[data.symbol]++;
              }
              stockData.likes = obj[data.symbol];
              console.log(obj);
              res.json({
                stockData: stockData,
              });
            }
          })

          .catch((err) => {
            console.log(err);
          });
      } else {
        stockData.likes = obj[data.symbol] || 0;
        
        res.json({
          stockData: stockData,
        });
      }
    }
  });
};
