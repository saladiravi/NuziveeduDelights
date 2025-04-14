const ordercontroller=require('../Controller/orderController');

const  express=require('express');
const router= express.Router();

 router.post('/addorder',ordercontroller.addOrder);
 router.post('/getorderdetailssuserbyid',ordercontroller.getOrderDetailsByUserId)


module.exports=router
 