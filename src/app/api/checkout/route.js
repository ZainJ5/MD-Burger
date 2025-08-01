import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Order from "@/app/models/Order";
import path from "path";
import fs from "fs";

function getId(idField) {
  if (typeof idField === "object" && idField !== null) {
    if (idField.$oid) return idField.$oid;
    if (idField._id) return getId(idField._id);
  }
  return idField;
}

async function saveFile(file, directory) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const fullPath = path.join(process.cwd(), 'public', directory);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = file.name.split('.').pop();
  const filename = `${uniqueSuffix}.${extension}`;
  const filePath = path.join(fullPath, filename);
  
  fs.writeFileSync(filePath, buffer);
  
  return `/${directory}/${filename}`;
}

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();

    const fullName = formData.get("fullName");
    const mobileNumber = formData.get("mobileNumber");
    const alternateMobile = formData.get("alternateMobile");
    const deliveryAddress = formData.get("deliveryAddress");
    const nearestLandmark = formData.get("nearestLandmark");
    const email = formData.get("email");
    const paymentInstructions = formData.get("paymentInstructions");
    const paymentMethod = formData.get("paymentMethod");
    const changeRequest = formData.get("changeRequest");
    const subtotal = Number(formData.get("subtotal"));
    const tax = Number(formData.get("tax"));
    const discount = Number(formData.get("discount"));
    const total = Number(formData.get("total"));
    const promoCode = formData.get("promoCode");
    const isGift = formData.get("isGift") === "true";
    const giftMessage = formData.get("giftMessage");
    const orderType = formData.get("orderType");
    const branch = formData.get("branch");
    const area = formData.get("area");

    let items = [];
    const itemsJson = formData.get("items");
    if (itemsJson) {
      try {
        items = JSON.parse(itemsJson);
      } catch (err) {
        console.error("Error parsing items:", err);
      }
    }

    if (items && Array.isArray(items)) {
      items = items.map((item, index) => {
        const menuId =
          item.id ||
          (item._id ? getId(item._id) : item.cartItemId ? item.cartItemId.split("-")[0] : null);

        if (!menuId) {
          console.error(`Item at index ${index} is missing a menu id:`, item);
        }
        const idValue = menuId ? Number(menuId) : 0;
        if (!idValue) {
          console.error(
            `Converted menu id is falsy for item at index ${index}. Original menuId:`,
            menuId
          );
        }
        return {
          id: idValue,
          name: item.name || item.title || "",
          price: Number(item.price) || 0,
          type: item.type || ""
        };
      });
    }

    let receiptImageUrl = null;
    const file = formData.get("receiptImage");
    if (paymentMethod === "online" && file && file.size > 0) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ message: "File size exceeds 5MB limit" }, { status: 400 });
      }
      
      receiptImageUrl = await saveFile(file, 'receipts');
    }

    const orderData = {
      fullName,
      mobileNumber,
      alternateMobile,
      deliveryAddress,
      nearestLandmark,
      email,
      paymentInstructions,
      paymentMethod,
      changeRequest,
      items,
      subtotal,
      tax,
      discount,
      total,
      promoCode,
      isGift,
      giftMessage,
      orderType,
      branch,
      area,
    };

    if (paymentMethod === "online" && receiptImageUrl) {
      orderData.receiptImageUrl = receiptImageUrl;
      orderData.bankName = formData.get("bankName") || "ABC Bank";
    }

    console.log("Transformed items:", orderData.items);

    const newOrder = await Order.create(orderData);
    const populatedOrder = await newOrder.populate("branch");
    
    if (global.io) {
      global.io.emit('newOrder', populatedOrder);
      console.log('New order event emitted');
    }
    
    console.log("Created Order:", populatedOrder);
    return NextResponse.json(populatedOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
  }
}