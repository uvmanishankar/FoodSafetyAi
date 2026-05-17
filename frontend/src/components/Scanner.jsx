import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { verifyIngredients } from '../api/api';

const Scanner = () => {
    const [image, setImage] = useState(null);
    const [ocrText, setOcrText] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const processImage = async () => {
        if (!image) return;
        setLoading(true);
        setResults(null);
        try {
            const { data: { text } } = await Tesseract.recognize(image, 'eng', {
                logger: m => console.log(m)
            });
            setOcrText(text);

            // Simple splitting by comma or newline for MVP
            const ingredients = text.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 2);

            const verificationResult = await verifyIngredients(ingredients);
            setResults(verificationResult);

        } catch (err) {
            console.error(err);
            alert('Error processing image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-md max-w-md mx-auto mt-4">
            <h2 className="text-xl font-bold mb-4">Ingredient Scanner</h2>

            <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">Upload Label Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {image && (
                <div className="mb-4">
                    <img src={image} alt="Uploaded" className="max-h-64 rounded mx-auto" />
                    <button
                        onClick={processImage}
                        disabled={loading}
                        className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Analyze Ingredients'}
                    </button>
                </div>
            )}

            {results && (
                <div className="mt-4">
                    <h3 className="font-bold text-lg">Results:</h3>
                    {results.flagged.length > 0 ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mt-2">
                            <p className="font-bold">⚠️ Banned/Restricted Ingredients Found:</p>
                            <ul className="list-disc ml-5">
                                {results.flagged.map((item, idx) => (
                                    <li key={idx}>
                                        <span className="font-semibold">{item.ingredient}</span> - {item.reason} ({item.source})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mt-2">
                            <p className="font-bold">✅ No banned ingredients detected.</p>
                        </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500">
                        <p>Raw OCR Text: {ocrText.substring(0, 100)}...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;
