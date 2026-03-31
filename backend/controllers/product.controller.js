import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";
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
        let featuredProducts = null;

        if (redis) {
            try {
                if (redis.status === "wait") {
                    await redis.connect();
                }
                featuredProducts = await redis.get("featured_products");
            } catch (error) {
                console.log("Redis read failed, falling back to MongoDB", error.message);
            }
        }

        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        //if not in redis then find from databse monogodb
        //.lean() is gonna return a javascript object instead of a mongodb document 
        featuredProducts = await Product.find({isFeatured:true}).lean();

        if(!featuredProducts || featuredProducts.length === 0) {
            return res.status(404).json({message : "No featured products found"});
        }
        if (redis) {
            try {
                await redis.set("featured_products", JSON.stringify(featuredProducts));
            } catch (error) {
                console.log("Redis write failed, skipping cache", error.message);
            }
        }
        return res.json(featuredProducts);

    } catch (error) {
        console.log("Error in getFeatureProducts", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        let { name, description, price, category, image } = req.body;
        let cloudResponse = null;

        if(image) {
            cloudResponse = await cloudinary.uploader.upload(image, {
                folder: "products"
            })
        }
        
        const product = await Product.create({
            name,
            description,
            price,
            category,
            image: cloudResponse ? cloudResponse.secure_url : null
        });
        return res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        console.log("Error in createProduct", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    if(product.image) {
        const publicId = product.image.split('/').pop().split('.')[0];
        try {
            await cloudinary.uploader.destroy(publicId);
            console.log("deleted from cloudanary");
            
            
        } catch (error) {
            console.log("Error deleting image from Cloudinary", error.message);
        }
    }
    await product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.log("Error in deleteProduct", error.message);
        return res.status(500).json({ message: "Server error", error: error.message }); 
    }
    
}


export const getRecommendedProducts = async (req, res) => {
    try{
        const products = await Product.aggregate([
            {
                $sample: { size: 3}
            },
            {
                $project: {
                    _id:1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1,
                }
            }
        ])
        res.json({products});
    }catch(error){
        console.log('Error in getRecommendedProducts', error.message);
        res.status(500).json({message: "server error", error : error.message});
    }
}

export const getProductBycategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category });
        res.json({ products });
    } catch (error) {
        console.log('Error in getProductBycategory', error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.featured = !product.featured;
        const updatedProduct = await product.save();
        await updateFeaturedProductsCache();
        res.json({ message: "Product featured status updated", product: updatedProduct });
    } catch (error) {
        console.log('Error in toggleFeaturedProduct', error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function updateFeaturedProductsCache() {
    try {
        //lean method is used to convert the mongoose document into a plain javascript object which is more suitable for caching in redis
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (redis) {
            try {
                await redis.set("featured_products", JSON.stringify(featuredProducts));
            } catch (error) {
                console.log("Redis write failed in updateFeaturedProductsCache", error.message);
            }
        }
    } catch (error) {
        console.log('Error in updateFeaturedProductsCache', error.message);
    }
}