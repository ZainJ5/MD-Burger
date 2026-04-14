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

async function sendWhatsAppMessage(to, text) {
  console.log("In Whatsapp function")
  let formattedTo = to.trim();
  if (formattedTo.startsWith('0')) {
    formattedTo = '+92' + formattedTo.slice(1);
  } else if (!formattedTo.startsWith('+')) {
    formattedTo = '+92' + formattedTo;
  }
  try {
    const response = await fetch("https://wasenderapi.com/api/send-message", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WASENDER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ to: formattedTo, text })
    });
    console.log("Response:", await response.text());

    if (!response.ok) {
      console.error(`Failed to send WhatsApp message to ${formattedTo}:`, await response.text());
    }
  } catch (error) {
    console.error(`Error sending WhatsApp message to ${formattedTo}:`, error);
  }
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
        const parsedItems = JSON.parse(itemsJson);
        
        if (Array.isArray(parsedItems)) {
          items = parsedItems.map((item, index) => {
            const id = item.id || 
                     (item._id ? getId(item._id) : 
                      (item.cartItemId ? item.cartItemId.split("-")[0] : null));
            
            const formattedItem = {
              id: id,
              title: item.title || item.name || "",
              description: item.description || "",
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1,
              imageUrl: item.imageUrl || null,
              specialInstructions: item.specialInstructions || ""
            };
            
            if (item.selectedVariation || item.type) {
              formattedItem.selectedVariation = item.selectedVariation || {
                name: item.type || "",
                price: Number(item.price) || 0
              };
            }
            
            if (item.selectedExtras && Array.isArray(item.selectedExtras) && item.selectedExtras.length > 0) {
              formattedItem.selectedExtras = item.selectedExtras.map(extra => ({
                name: extra.name || "",
                price: Number(extra.price) || 0
              }));
            }
            
            if (item.selectedSideOrders && Array.isArray(item.selectedSideOrders) && item.selectedSideOrders.length > 0) {
              formattedItem.selectedSideOrders = item.selectedSideOrders.map(sideOrder => ({
                name: sideOrder.name || "",
                price: Number(sideOrder.price) || 0,
                category: sideOrder.category || "other"
              }));
            }
            
            if (item.modifications && Array.isArray(item.modifications) && item.modifications.length > 0) {
              item.modifications.forEach(mod => {
                if (mod.type === 'variation' && mod.items && mod.items.length > 0) {
                  formattedItem.selectedVariation = {
                    name: mod.items[0].name || "",
                    price: Number(mod.items[0].price) || 0
                  };
                } else if (mod.type === 'extras' && mod.items && mod.items.length > 0) {
                  formattedItem.selectedExtras = mod.items.map(extra => ({
                    name: extra.name || "",
                    price: Number(extra.price) || 0
                  }));
                } else if ((mod.type === 'sideOrders' || mod.type === 'sideorders') && mod.items && mod.items.length > 0) {
                  formattedItem.selectedSideOrders = mod.items.map(sideOrder => ({
                    name: sideOrder.name || "",
                    price: Number(sideOrder.price) || 0,
                    category: sideOrder.category || "other"
                  }));
                }
              });
            }
            
            return formattedItem;
          });
        }
      } catch (err) {
        console.error("Error parsing items:", err);
        return NextResponse.json({ message: "Failed to parse order items" }, { status: 400 });
      }
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

    const confirmationMessage = `Thanks for Ordering at Kingice.pk\nYour Order Will Deliver in 30 to 45 min\nYour Order number is: ${populatedOrder.orderNo}.`;

    // await sendWhatsAppMessage(mobileNumber, confirmationMessage);
    // if (alternateMobile) {
    //   console.log("Alternate no. found")
    //   await sendWhatsAppMessage(alternateMobile, confirmationMessage);
    // }
    
    console.log("Created Order:", populatedOrder);
    return NextResponse.json(populatedOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        message: "Validation error", 
        details: Object.values(error.errors).map(err => err.message) 
      }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
  }
}