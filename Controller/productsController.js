const pool = require('../db/db')




exports.addproduct = async (req, res) => {
    try {

        const { product_name, stock, description, category_id, price_grams } = req.body;

        if (!product_name || !category_id || !price_grams) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Product name, category, and price_grams are required'
            });
        }

        const productImage = req.files?.product_image?.[0]?.filename
            ? `uploads/${req.files.product_image[0].filename}`
            : null;


        const productQuery = `
            INSERT INTO public.tbl_product (product_name, product_image, stock, description,category_id,product_status)
            VALUES ($1, $2, $3, $4,$5,'visible') RETURNING product_id
        `;
        const productResult = await pool.query(productQuery, [product_name, productImage, stock, description, category_id]);
        const product_id = productResult.rows[0].product_id;


        const priceGramsData = Array.isArray(price_grams) ? price_grams : JSON.parse(price_grams);


        for (const { grams, price } of priceGramsData) {
            await pool.query(
                `INSERT INTO public.tbl_grams (grams, price, product_id) VALUES ($1, $2, $3)`,
                [grams, price, product_id]
            );
        }

        res.status(200).json({
            statusCode: 200,
            message: 'Product and price-grams added successfully',
            product: {
                product_id,
                product_name,
                product_image: productImage,
                stock,
                description,
                category_id,
                price_grams: priceGramsData
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};


exports.getAllProduct = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.product_id,
                p.product_name,
                p.product_image,
                p.stock,
                p.description,
                p.product_status,
                c.category_name,
                json_agg(
                    json_build_object(
                        'grams', g.grams, 
                        'price', g.price
                    )
                ) AS price_grams
            FROM tbl_product p
            INNER JOIN tbl_grams g ON p.product_id = g.product_id
            INNER JOIN tbl_category c ON p.category_id = c.category_id
            GROUP BY p.product_id, p.product_name, p.product_image, p.stock,p.description,product_status,c.category_name;
        `;

        const result = await pool.query(query); // Execute the SQL query

        res.status(200).json({
            statusCode: 200,
            data: result.rows, // Send the formatted data
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};


exports.getProductById = async (req, res) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Product ID is required'
            });
        }

        const query = `
            SELECT 
                p.product_id,
                p.product_name,
                p.product_image,
                p.stock,
                p.description,
                p.product_status,
                c.category_name,
                json_agg(
                    json_build_object(
                        'grams', g.grams, 
                        'price', g.price
                    )
                ) AS price_details
            FROM tbl_product p
            INNER JOIN tbl_grams g ON p.product_id = g.product_id
            INNER JOIN tbl_category c ON p.category_id = c.category_id
            WHERE p.product_id = $1
            GROUP BY p.product_id, p.product_name, p.product_image, p.stock,p.description,p.product_status, c.category_name;
        `;

        const result = await pool.query(query, [product_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            statusCode: 200,
            data: result.rows[0], // Return only the product object
        });

    } catch (error) {
        console.error("Error fetching product by ID:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};


exports.updateProduct = async (req, res) => {
    try {
        const { product_id, product_name, stock, description, category_id, price_grams } = req.body;

        if (!product_id || !product_name || !category_id || !price_grams) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Product ID, name, category, and price_grams are required'
            });
        }

        const productImage = req.files?.product_image?.[0]?.filename
            ? `uploads/${req.files.product_image[0].filename}`
            : null;

       
        const updateProductQuery = `
            UPDATE public.tbl_product 
            SET product_name = $1, stock = $2, category_id = $3, description = $4,
                product_image = COALESCE($5, product_image)
            WHERE product_id = $6 AND product_status = 'visible'
            RETURNING product_id
        `;

        const updateResult = await pool.query(updateProductQuery, [product_name, stock, category_id, description, productImage, product_id]);

        if (updateResult.rowCount === 0) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Product not found or Hidden'
            });
        }

        const priceGramsData = Array.isArray(price_grams) ? price_grams : JSON.parse(price_grams);

        await pool.query(`DELETE FROM public.tbl_grams WHERE product_id = $1`, [product_id]);

        for (const { grams, price } of priceGramsData) {
            await pool.query(
                `INSERT INTO public.tbl_grams (grams, price, product_id) VALUES ($1, $2, $3)`,
                [grams, price, product_id]
            );
        }

        res.status(200).json({
            statusCode: 200,
            message: 'Product updated successfully',
            product: {
                product_id,
                product_name,
                product_image: productImage,
                stock,
                description,
                category_id,
                price_grams: priceGramsData
            }
        });

    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Product ID is required'
            });
        }


        const checkProductQuery = `SELECT * FROM public.tbl_product WHERE product_id = $1`;
        const productResult = await pool.query(checkProductQuery, [product_id]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Product not found'
            });
        }


        await pool.query(`DELETE FROM public.tbl_grams WHERE product_id = $1`, [product_id]);


        await pool.query(`DELETE FROM public.tbl_product WHERE product_id = $1`, [product_id]);

        res.status(200).json({
            statusCode: 200,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};


exports.getproductBycategory = async (req, res) => {
    try {
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Category name is required'
            });
        }

        const query = `
        SELECT 
            p.product_id,
            p.product_name,
            p.product_image,
            p.stock,
            p.description,
            c.category_name,
            json_agg(
                json_build_object(
                    'grams', g.grams, 
                    'price', g.price
                )
            ) AS price_details
        FROM tbl_product p
        INNER JOIN tbl_grams g ON p.product_id = g.product_id
        INNER JOIN tbl_category c ON p.category_id = c.category_id
        WHERE c.category_name = $1 AND p.product_status = 'visible'  -- Add product_status filter
        GROUP BY p.product_id, p.product_name, p.product_image, p.stock, p.description, c.category_name;
    `;

        const result = await pool.query(query, [category_name]);  



        res.status(200).json({
            statusCode: 200,
            data: result.rows, // Send the formatted data
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};


exports.updateProductStatus = async (req, res) => {
    try {
        const { product_id, product_status } = req.body;

        if (!product_id || !product_status) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Product ID and product_status are required'
            });
        }

        // Ensure product_status is either 'visible' or 'hidden'
        if (!['visible', 'hidden'].includes(product_status)) {
            return res.status(400).json({
                statusCode: 400,
                message: "Invalid status. Allowed values: 'visible', 'hidden'"
            });
        }

        const updateStatusQuery = `
            UPDATE public.tbl_product 
            SET product_status = $1 
            WHERE product_id = $2
            RETURNING product_id, product_status
        `;

        const updateResult = await pool.query(updateStatusQuery, [product_status, product_id]);

        if (updateResult.rowCount === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            statusCode: 200,
            message: 'Product status updated successfully',
            product: updateResult.rows[0]
        });

    } catch (error) {
        console.error("Error updating product status:", error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }
};