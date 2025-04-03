const pool = require('../db/db');
 

exports.addCart = async (req, res) => {
    const { product_id,pricegrams_id,quantity,user_id} = req.body

    try {
        if (!product_id,!user_id,pricegrams_id) {
            return res.status(400).json({ error: 'Produt ,user,grams are required' });

        }

      
        const existcart = await pool.query('SELECT * FROM public.tbl_cart WHERE pricegrams_id=$1', [pricegrams_id]);
        if (existcart.rows.length > 0) {
            return res.status(400).json({ 
                stausCode:400,
                message: 'grams already exists' });
        }

         
        const cart= await pool.query(
            'INSERT INTO public.tbl_cart(product_id,pricegrams_id,quantity,user_id) VALUES($1,$2,$3,$4)',
            [product_id,pricegrams_id,quantity,user_id]
        )

        res.status(200).json({
            statusCode: 200,
            message: 'Cart Added Successfully',
            cart: cart.rows[0],
        })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

 


exports.getallCarts=async(req,res)=>{
    try
    {
        const allcategory=await pool.query("SELECT * FROM tbl_cart");
        res.status(200).json({
            statusCode:200,
            message:'Categories Fetched Sucessfully',
            categories:allcategory.rows,
        })
    }catch(err){
        res.status(500).json({message:'Internal Server error'})
    }
}

exports.getcartByid=async(req,res)=>{
    try
    {
        const {cart_id}=req.body;
        
        const cartid=await pool.query(
            "SELECT * FROM tbl_cart WHERE cart_id=$1",
            [category_id] 
        );

        if(cartid.rows.length ===0){
            return res.status(404).json({
                statusCode:404,
                message:"cart not found"
            })
        }
        res.status(200).json({
            statusCode:200,
            message:'cart fectched sucessfully',
            cart:cartid.rows[0]
        })
    }catch(error){
        res.status(500).json({
            statusCode:500,
            message:'internal Server error'
        })
    }
}


exports.updatecategory=async(req,res)=>{
    try{
    const { category_id,category_name}=req.body
    const fileds=[];
    const values=[];
    let index=1;
    

    if(category_name){
        fileds.push(`"category_name"=$${index++}`);
        values.push(category_name)
    }
     
    values.push(category_id);
    if(fileds.length === 0){
        return res.status(400).json({
            statusCode:400,
            message:'No fileds provided to update'
        })
    }
    const query=`
    UPDATE tbl_category
    SET ${fileds.join(', ')}
    WHERE "category_id"=$${index++}
    RETURNING *`
    const  result=await pool.query(query,values);
    if(result.rowCount ===0){
        return res.status(404).json({
            statusCode:404,
            message:'category Not Found'
        
        })
    }
    res.status(200).json({
        statusCode:200,
        message:'Category Updated Sucesfully',
        category:result.rows[0],

    })
    }catch(error){
        res.status(500).json({  
            statusCode: 500,
            message: 'Internal Server Error',
        });
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const { category_id } = req.body;

        if (!category_id) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Category ID is required',
            });
        }

       
        const checkCategory = await pool.query(
            'SELECT * FROM tbl_category WHERE category_id = $1',
            [category_id]
        );

        if (checkCategory.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Category not found',
            });
        }

        
        const deleteCategory = await pool.query(
            'DELETE FROM tbl_category WHERE category_id = $1 RETURNING *',
            [category_id]
        );

        res.status(200).json({
            statusCode: 200,
            message: 'Category deleted successfully',
            deletedCategory: deleteCategory.rows[0],
        });

    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error',
        });
    }
};

 