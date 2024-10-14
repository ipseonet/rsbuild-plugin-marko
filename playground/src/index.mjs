import example from './templates/example.marko';

//One way to use js to render marko pages for client side.
// async function renderExample() {
//     try{
//         const result = await example.render({ label: 'Click me!' });
//         result.appendTo(document.body);
//     } catch (err) {
//         console.log('Didn\'t work...\n', err);
//     }
// }
// renderExample();


//Another way to render .marko using js as shown on the markojs website for client side.
const html = example.renderToString({});
console.log(html);

var resultPromise = example.render({});

resultPromise.then((result) => {
    result.appendTo(document.body);
});


