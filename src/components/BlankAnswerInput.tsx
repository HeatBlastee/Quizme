import React from "react";
import keyword_extractor from "keyword-extractor";

type Props = {
    answer: string;
    setBlankAnswer: React.Dispatch<React.SetStateAction<string>>;
};

const blank = "_____";

const BlankAnswerInput = ({ answer, setBlankAnswer }: Props) => {
    const [inputValues, setInputValues] = React.useState<string[]>([]);

    const keywords = React.useMemo(() => {
        const words = keyword_extractor.extract(answer, {
            language: "english",
            remove_digits: true,
            return_changed_case: false,
            remove_duplicates: false,
        });
        const shuffled = words.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }, [answer]);

    const answerWithBlanks = React.useMemo(() => {
        const result = keywords.reduce((acc, curr) => acc.replaceAll(curr, blank), answer);
        return result;
    }, [answer, keywords]);

    // Reset input values whenever answerWithBlanks changes
    React.useEffect(() => {
        const blanksCount = (answerWithBlanks.match(new RegExp(blank, "g")) || []).length;
        setInputValues(new Array(blanksCount).fill(""));
    }, [answerWithBlanks]);

    // Update final filled answer on input change
    React.useEffect(() => {
        let index = 0;
        const filled = answerWithBlanks.replace(new RegExp(blank, "g"), () => inputValues[index++] || blank);
        setBlankAnswer(filled);
    }, [inputValues, answerWithBlanks, setBlankAnswer]);

    const handleInputChange = (idx: number, value: string) => {
        const updated = [...inputValues];
        updated[idx] = value;
        setInputValues(updated);
    };

    return (
        <div className="flex justify-start w-full mt-4">
            <h1 className="text-xl font-semibold flex flex-wrap gap-1">
                {answerWithBlanks.split(blank).map((part, index, arr) => (
                    <React.Fragment key={index}>
                        <span>{part}</span>
                        {index < arr.length - 1 && (
                            <input
                                className="user-blank-input text-center border-b-2 border-black dark:border-white w-28 focus:border-2 focus:border-b-4 focus:outline-none"
                                type="text"
                                value={inputValues[index] || ""}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                            />
                        )}
                    </React.Fragment>
                ))}
            </h1>
        </div>
    );
};

export default BlankAnswerInput;
