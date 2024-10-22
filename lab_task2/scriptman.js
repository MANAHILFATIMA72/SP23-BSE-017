document.addEventListener("DOMContentLoaded", function() {
    const productsList = document.getElementById('productsList');
    
    function fetchProducts() {
        fetch('https://fakestoreapi.com/products')
            .then(response => response.json())
            .then(data => {
                productsList.innerHTML = ''; 
                data.forEach(product => {
                    const li = document.createElement('li');
                    li.setAttribute('data-id', product.id);
                    li.innerHTML = `ID: ${product.id}, Title: ${product.title}, Price: $${product.price}, Description: ${product.description}`;
                    productsList.appendChild(li);
                });
            });
    }

    fetchProducts(); 

    document.getElementById('createProductForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const title = document.getElementById('createTitle').value;
        const price = document.getElementById('createPrice').value;
        const description = document.getElementById('createDescription').value;

        fetch('https://fakestoreapi.com/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                price,
                description
            })
        })
        .then(response => response.json())
        .then(data => {
            const li = document.createElement('li');
            li.setAttribute('data-id', data.id);
            li.innerHTML = `ID: ${data.id}, Title: ${data.title}, Price: $${data.price}, Description: ${data.description}`;
            productsList.appendChild(li);
            document.getElementById('createProductForm').reset(); 
        });
    });

    document.getElementById('updateProductForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const id = document.getElementById('updateId').value;
        const title = document.getElementById('updateTitle').value;
        const price = document.getElementById('updatePrice').value;
        const description = document.getElementById('updateDescription').value;

        fetch(`https://fakestoreapi.com/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                price,
                description
            })
        })
        .then(response => response.json())
        .then(data => {
            const li = productsList.querySelector(`[data-id='${id}']`);
            if (li) {
                li.innerHTML = `ID: ${data.id}, Title: ${data.title}, Price: $${data.price}, Description: ${data.description}`;
                document.getElementById('updateProductForm').reset(); 
            }
        });
    });

    document.getElementById('deleteProductForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const id = document.getElementById('deleteId').value;

        fetch(`https://fakestoreapi.com/products/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            const li = productsList.querySelector(`[data-id='${id}']`);
            if (li) {
                productsList.removeChild(li); 
                document.getElementById('deleteProductForm').reset();
            }
        });
    });
});
