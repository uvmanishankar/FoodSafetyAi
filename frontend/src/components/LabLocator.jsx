import React, { useEffect, useState } from 'react';
import { fetchLabs } from '../api/api';

const LabLocator = () => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLabs = async () => {
            try {
                const data = await fetchLabs();
                setLabs(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadLabs();
    }, []);

    if (loading) return <div>Loading labs...</div>;

    return (
        <div className="p-4 bg-white rounded shadow-md max-w-md mx-auto mt-4">
            <h2 className="text-xl font-bold mb-4">Find Testing Labs</h2>
            <div className="space-y-4">
                {labs.map(lab => (
                    <div key={lab.id} className="border p-3 rounded hover:bg-gray-50">
                        <h3 className="font-bold text-lg">{lab.name}</h3>
                        <p className="text-gray-600">{lab.address}</p>
                        <p className="text-sm text-blue-600 mt-1">📞 {lab.contact}</p>
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-2">
                            {lab.accreditation}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LabLocator;
