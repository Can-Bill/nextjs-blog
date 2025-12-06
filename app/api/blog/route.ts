import {prisma} from "@/services/db"
import {NextResponse} from "next/server"
import path from "path"
import fs from "fs"
import { randomUUID } from "crypto"


export async function main(){
    try{
        await prisma.$connect()
    }catch(err){
        throw new Error("Error in blog route")
    }
}

//creation of first request to search our data from db
export const GET = async () => {
    try{    
        await main();
        const posts = await prisma.post.findMany();
        return NextResponse.json({message: "Success", posts}, {status: 200})
    }catch(err){
        return NextResponse.json({message: "Error in blog route"}, {status: 500})
    }finally{
        await prisma.$disconnect()
    }
}

export const POST = async (req: Request) =>{
    try{
        const formData = await req.formData()
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const category = formData.get("category") as string;
        const image = formData.get("image") as File | null;

        //verification of data 
        if(!title || !description || !category){
            return NextResponse.json({message: "All fields are required"}, {status:400})
        }

        //connection to the database
        await main()
        let imageUrl: string | null = null;
        
        if(image){
            try{
                const buffer = Buffer.from(await image.arrayBuffer())
                const fileName = `${randomUUID()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
                //creation of repertory to upload image
                const uploadDir = path.join(process.cwd(), 'public', 'uploads')
                const imagePath = path.join(uploadDir, fileName)
                await fs.promises.writeFile(imagePath, buffer)
                imageUrl = `/uploads/${fileName}`

            }catch(err){
                imageUrl = null
            }
        }
        //start the POST methode
        const post = await prisma.post.create({
            data:{
                title,
                description,
                category,
                imageUrl
            }
        })

        return NextResponse.json({message: "Post created successfully", post}, {status: 201})

    }catch(err){

        return NextResponse.json({message: "Error in blog route"}, {status: 500})
    
    }finally{

        await prisma.$disconnect
    }
}