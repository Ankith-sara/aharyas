import ReactDOM from 'react-dom';
import { X, Ruler } from 'lucide-react';
import { sizeCharts, getSizeChartKey } from './SizeChart';

const SizeChartModal = ({ isOpen, onClose, productName, category, subCategory }) => {
    if (!isOpen) return null;

    const chartKey = getSizeChartKey(productName, category, subCategory);
    const chart    = sizeCharts[chartKey];

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Size chart"
        >
            <div
                className="bg-white shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sticky header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Ruler size={20} className="text-black flex-shrink-0" />
                        <div>
                            <h3 className="text-xl font-medium text-black tracking-wide">{chart.title}</h3>
                            {chart.subtitle && (
                                <p className="text-sm text-gray-500 mt-0.5">{chart.subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                        aria-label="Close size chart"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Table */}
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-black text-white">
                                    {chart.headers.map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {chart.rows.map((row, ri) => (
                                    <tr
                                        key={ri}
                                        className={`${ri % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                                    >
                                        {row.map((cell, ci) => (
                                            <td
                                                key={ci}
                                                className={`px-4 py-3 text-sm border-b border-gray-200 ${ci === 0 ? 'font-medium' : ''}`}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tips */}
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-700 font-medium mb-2">How to Measure</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• <strong>Chest:</strong> Around the fullest part of your chest</li>
                                <li>• <strong>Waist:</strong> Around your natural waistline</li>
                                <li>• <strong>Hip:</strong> Around the fullest part of your hips</li>
                                <li>• <strong>Shoulder:</strong> One shoulder point to the other across your back</li>
                                <li>• <strong>Sleeve:</strong> Shoulder to wrist with arm slightly bent</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-amber-50 border-l-4 border-amber-500">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Sizing tip:</span> If you're between sizes, size up for a more comfortable fit.
                                Measurements are in inches and may vary slightly due to the handcrafted nature of our products.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SizeChartModal;
