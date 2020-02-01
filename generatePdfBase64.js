const pdfMakePrinter = require('pdfmake/src/printer');

exports.generatePdf = function(docDefinition, callback) {
	try {
		const fontDescriptors = {
			Helvetica: {
				normal: 'Helvetica',
				bold: 'Helvetica-Bold',
				italics: 'Helvetica-Oblique',
				bolditalics: 'Helvetica-BoldOblique'
			}
		};
		const printer = new pdfMakePrinter(fontDescriptors);
		const doc = printer.createPdfKitDocument(docDefinition);
		
		let chunks = [];

		doc.on('data', (chunk) => {
			chunks.push(chunk);
		});
	
		doc.on('end', () => {
			callback(Buffer.concat(chunks));
		});
		
		doc.end();
		
	} catch(err) {
		throw(err);
	}
};