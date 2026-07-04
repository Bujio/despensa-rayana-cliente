export const userModel = {
  update(request, userId, form) {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: {
        country: form.country.trim(),
        street: form.street.trim(),
        codePostal: form.codePostal.trim(),
        city: form.city.trim(),
      },
    };

    if (form.password.trim()) payload.password = form.password;

    return request('/users/' + userId, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete(request, userId) {
    return request('/users/' + userId, { method: 'DELETE' });
  },
};
