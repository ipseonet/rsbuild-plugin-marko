import example from './templates/example.marko';

async function renderExample() {
    try{
        const result = await example.render({ label: 'Click me!' });
        result.appendTo(document.body);
    } catch (err) {
        console.log('Didn\'t work...\n', err);
    }
}
renderExample();
