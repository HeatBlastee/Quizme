import { prisma } from "@/lib/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import levenshtein from "js-levenshtein";

function hybridSimilarity(correct: string, user: string): number {
    correct = correct.toLowerCase().trim();
    user = user.toLowerCase().trim();

    // Levenshtein similarity
    const levDistance = levenshtein(correct, user);
    const levSim = 1 - levDistance / Math.max(correct.length, user.length);

    // Dice coefficient
    const bigrams = (str: string) => {
        const pairs = new Set<string>();
        for (let i = 0; i < str.length - 1; i++) {
            pairs.add(str.slice(i, i + 2));
        }
        return pairs;
    };

    const set1 = bigrams(correct);
    const set2 = bigrams(user);
    const intersection = [...set1].filter(b => set2.has(b)).length;
    const diceSim = (2 * intersection) / (set1.size + set2.size || 1);

    // Final score: weighted average (you can tune weights)
    const finalScore = (0.6 * levSim + 0.4 * diceSim) * 100;

    return Math.round(Math.max(0, Math.min(finalScore, 100)));
}

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
            const isCorrect =
                question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
            await prisma.question.update({
                where: { id: questionId },
                data: { isCorrect },
            });
            return NextResponse.json({ isCorrect });
        } else if (question.questionType === "open_ended") {
            const percentageSimilar = hybridSimilarity(question.answer, userInput);

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
