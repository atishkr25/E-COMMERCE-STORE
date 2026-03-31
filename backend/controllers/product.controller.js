import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try{
        const products = await Product.find({});
        res.json({products});
    } catch(error){
        console.log('Error in GetallProducts', error.message);
        res.status(500).json({message: "server error", error : error.message});
    }

}

export const getFeatureProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if(featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        //if not in redis then find from databse monogodb
        //.lean() is gonna return a javascript object instead of a mongodb document 
        featuredProducts = await Product.find({isFeatured:true}).lean();

        if(!featuredProducts || featuredProducts.length === 0) {
            return res.status(404).json({message : "No featured products found"});
        }
        await redis.set("featured_products", JSON.stringify(featuredProducts));
        return res.json(featuredProducts);

    } catch (error) {
        console.log("Error in getFeatureProducts", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category, isFeatured } = req.body;

        if (!name || !description || price === undefined || !image || !category) {
            return res.status(400).json({ message: "Please provide all required product fields" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image,
            category,
            isFeatured: Boolean(isFeatured),
        });

        await redis.del("featured_products");

        return res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        console.log("Error in createProduct", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

