const categorycontroller=require('../Controller/categoryController');
const  express=require('express');
const router= express.Router();

router.post('/addCategory',categorycontroller.addCategory);
router.get('/getallcategories',categorycontroller.getallCategories);
router.post('/getcategoryByid',categorycontroller.getcategoryByid);
router.post('/updatecategory',categorycontroller.updatecategory);
router.post('/deletecategory',categorycontroller.deleteCategory);


module.exports=router
 