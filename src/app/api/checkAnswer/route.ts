import { prisma } from "@/lib/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import levenshtein from "js-levenshtein";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { questionId, userInput } = checkAnswerSchema.parse(body);

        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        await prisma.question.update({
            where: { id: questionId },
            data: { userAnswer: userInput },
        });

        if (question.questionType === "mcq") {
            const isCorrect = question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
            await prisma.question.update({
                where: { id: questionId },
                data: { isCorrect },
            });
            return NextResponse.json({ isCorrect });
        } else if (question.questionType === "open_ended") {
            const correct = question.answer.toLowerCase().trim();
            const user = userInput.toLowerCase().trim();
            const distance = levenshtein(correct, user);
            const maxLen = Math.max(correct.length, user.length);
            const percentageSimilar = Math.max(0, Math.round((1 - distance / maxLen) * 100));
            console.log(percentageSimilar)
            await prisma.question.update({
                where: { id: questionId },
                data: { percentageCorrect: percentageSimilar },
            });

            return NextResponse.json({ percentageSimilar });
        }
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ message: error.issues }, { status: 400 });
        }

        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
