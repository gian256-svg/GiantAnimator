
import { enrichAnalysisWithCallouts } from '../calloutService.js';
import fs from 'fs';

const mockAnalysis = {
    props: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [{
            label: "Vendas",
            data: [10, 50, 20, 80, 30, 100]
        }]
    }
};

async function test() {
    console.log("Testing enrichAnalysisWithCallouts...");
    try {
        const result = await enrichAnalysisWithCallouts(mockAnalysis as any);
        console.log("Result:", JSON.stringify(result.props.annotations, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
